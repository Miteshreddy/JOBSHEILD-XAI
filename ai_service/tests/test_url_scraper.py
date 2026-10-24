import pytest

from ai_service.input_processing import url_scraper


class TestSsrfValidation:
    def test_rejects_non_http_scheme(self):
        with pytest.raises(url_scraper.UnsafeUrlError):
            url_scraper._validate_url_is_safe("ftp://example.com/job")

    def test_rejects_url_with_no_hostname(self):
        with pytest.raises(url_scraper.UnsafeUrlError):
            url_scraper._validate_url_is_safe("http:///path")

    def test_rejects_loopback_address(self, monkeypatch):
        monkeypatch.setattr(
            url_scraper.socket, "getaddrinfo", lambda host, port: [(2, 1, 6, "", ("127.0.0.1", 0))]
        )
        with pytest.raises(url_scraper.UnsafeUrlError):
            url_scraper._validate_url_is_safe("http://localhost/job")

    def test_rejects_cloud_metadata_address(self, monkeypatch):
        monkeypatch.setattr(
            url_scraper.socket,
            "getaddrinfo",
            lambda host, port: [(2, 1, 6, "", ("169.254.169.254", 0))],
        )
        with pytest.raises(url_scraper.UnsafeUrlError):
            url_scraper._validate_url_is_safe("http://metadata.internal/job")

    def test_rejects_private_network_address(self, monkeypatch):
        monkeypatch.setattr(
            url_scraper.socket, "getaddrinfo", lambda host, port: [(2, 1, 6, "", ("10.0.0.5", 0))]
        )
        with pytest.raises(url_scraper.UnsafeUrlError):
            url_scraper._validate_url_is_safe("http://internal.example/job")

    def test_allows_public_address(self, monkeypatch):
        monkeypatch.setattr(
            url_scraper.socket, "getaddrinfo", lambda host, port: [(2, 1, 6, "", ("93.184.216.34", 0))]
        )
        url_scraper._validate_url_is_safe("http://example.com/job")  # should not raise

    def test_rejects_unresolvable_hostname(self, monkeypatch):
        import socket as real_socket

        def raise_gaierror(host, port):
            raise real_socket.gaierror("not found")

        monkeypatch.setattr(url_scraper.socket, "getaddrinfo", raise_gaierror)
        with pytest.raises(url_scraper.UnsafeUrlError):
            url_scraper._validate_url_is_safe("http://does-not-exist.invalid/job")


class TestJsonLdExtraction:
    def test_extracts_job_posting_from_json_ld(self):
        from bs4 import BeautifulSoup

        html = """
        <html><head>
        <script type="application/ld+json">
        {"@context": "https://schema.org", "@type": "JobPosting",
         "title": "Assistant Professor",
         "description": "<p>Join our CS department.</p>",
         "hiringOrganization": {"name": "KMIT"},
         "jobLocation": {"address": {"addressLocality": "Hyderabad", "addressCountry": "IN"}},
         "employmentType": "FULL_TIME"}
        </script>
        </head><body></body></html>
        """
        soup = BeautifulSoup(html, "html.parser")
        posting = url_scraper._jsonld_job_posting(soup)
        assert posting is not None

        fields, meta = url_scraper._fields_from_jsonld(posting)
        assert meta["company_name"] == "KMIT"
        assert fields["title"] == "Assistant Professor"
        assert fields["company_profile"] == "KMIT"
        assert "Join our CS department" in fields["description"]
        assert "Hyderabad" in fields["location"]

    def test_returns_none_when_no_json_ld_present(self):
        from bs4 import BeautifulSoup

        soup = BeautifulSoup("<html><body>plain page</body></html>", "html.parser")
        assert url_scraper._jsonld_job_posting(soup) is None

    def test_finds_job_posting_nested_in_graph(self):
        from bs4 import BeautifulSoup

        html = """<script type="application/ld+json">
        {"@context": "https://schema.org", "@graph": [{"@type": "WebPage"},
          {"@type": "JobPosting", "title": "Data Analyst", "hiringOrganization": {"name": "Acme"}}]}
        </script>"""
        posting = url_scraper._jsonld_job_posting(BeautifulSoup(html, "html.parser"))
        assert posting["title"] == "Data Analyst"


class TestGenericExtraction:
    def test_falls_back_to_page_title_and_main_content(self):
        html = "<html><head><title>Software Engineer at Acme</title></head><body><nav>menu</nav>" \
               "<article><p>We need a great engineer to build reliable payment systems for our customers. " \
               "You will work with a small team on backend services, reviews and on-call.</p></article></body></html>"
        fields, meta = url_scraper._extract(html, "https://acme.example/jobs/1")
        assert fields["title"] == "Software Engineer at Acme"
        assert "great engineer" in fields["description"]
        assert meta["extractor"] == "main_content"

    def test_parses_job_board_page_titles(self):
        html = "<html><head><title>Microsoft hiring Software Engineer in Cambridge, MA | LinkedIn</title></head>" \
               "<body><p>Build client components.</p></body></html>"
        fields, meta = url_scraper._extract(html, "https://www.linkedin.com/jobs/view/1")
        assert meta["company_name"] == "Microsoft"
        assert fields["title"] == "Software Engineer"
        assert fields["location"] == "Cambridge, MA"


class TestLinkedIn:
    @pytest.mark.parametrize(
        "url, job_id",
        [
            ("https://www.linkedin.com/jobs/view/software-engineer-at-microsoft-4480367579", "4480367579"),
            ("https://www.linkedin.com/jobs/view/4480367579/", "4480367579"),
            ("https://www.linkedin.com/jobs/search/?currentJobId=4480367579&keywords=x", "4480367579"),
            ("https://www.linkedin.com/company/microsoft", None),
        ],
    )
    def test_job_id_parsing(self, url, job_id):
        assert url_scraper._linkedin_job_id(url) == job_id

    def test_guest_page_extraction(self, monkeypatch):
        html = """
        <h2 class="top-card-layout__title topcard__title">Software Engineer</h2>
        <a class="topcard__org-name-link" href="https://www.linkedin.com/company/microsoft?trk=x">Microsoft</a>
        <span class="topcard__flavor topcard__flavor--bullet">Cambridge, MA</span>
        <span class="posted-time-ago__text">1 week ago</span>
        <div class="description__text description__text--rich">Overview: our team builds Intune client components.</div>
        <h3 class="description__job-criteria-subheader">Employment type</h3>
        <span class="description__job-criteria-text">Full-time</span>
        """
        monkeypatch.setattr(url_scraper, "_fetch", lambda url: (url, html))
        fields, meta = url_scraper._scrape_linkedin("4480367579")
        assert fields["company_profile"] == "Microsoft"
        assert fields["title"] == "Software Engineer"
        assert fields["employment_type"] == "Full-time"
        assert meta["company_page"] == "https://www.linkedin.com/company/microsoft"
        assert meta["posted"] == "1 week ago"
