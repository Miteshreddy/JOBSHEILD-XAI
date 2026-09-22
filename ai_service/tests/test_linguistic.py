from ai_service.preprocessing.linguistic import lemmatize, remove_stopwords


def test_remove_stopwords_drops_common_function_words():
    result = remove_stopwords("this is a job for the best candidate")
    tokens = result.split()
    assert "the" not in tokens
    assert "is" not in tokens
    assert "candidate" in tokens


def test_lemmatize_normalizes_plurals():
    result = lemmatize("companies requirements benefits")
    assert "company" in result.split()
