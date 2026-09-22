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
        posting = url_scraper._extract_job_posting_jsonld(soup)
        assert posting is not None

        fields = url_scraper._fields_from_jsonld(posting)
        assert fields["title"] == "Assistant Professor"
        assert fields["company_profile"] == "KMIT"
        assert "Join our CS department" in fields["description"]
        assert "Hyderabad" in fields["location"]

    def test_returns_none_when_no_json_ld_present(self):
        from bs4 import BeautifulSoup

        soup = BeautifulSoup("<html><body>plain page</body></html>", "html.parser")
        assert url_scraper._extract_job_posting_jsonld(soup) is None


class TestGenericExtraction:
    def test_falls_back_to_page_title_and_body_text(self):
        from bs4 import BeautifulSoup

        html = "<html><head><title>Software Engineer at Acme</title></head>" \
               "<body><nav>menu</nav><p>We need a great engineer.</p></body></html>"
        soup = BeautifulSoup(html, "html.parser")
        fields = url_scraper._fields_from_generic_page(soup)
        assert fields["title"] == "Software Engineer at Acme"
        assert "great engineer" in fields["description"]
        assert "menu" not in fields["description"]  # nav stripped
