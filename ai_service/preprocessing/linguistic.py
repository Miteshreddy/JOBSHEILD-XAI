"""Stop-word removal and lemmatization (SRS FR-2.4, FR-2.5 — Medium priority).

Design decision (Phase 1 gap-resolution, documented per project instructions
to flag deviations before applying them): these transforms are implemented and
independently testable here, but they are NOT applied to the text fed to the
BERT classifier by default. BERT's WordPiece tokenizer and pretrained
attention patterns rely on function words and inflectional morphology for
context; stripping stop words and lemmatizing before a transformer is standard
practice to avoid *when using TF-IDF/Bag-of-Words models*, but actively
discards signal a fine-tuned BERT model would otherwise use. They remain
available (and are exercised in `preprocess.py` via `apply_linguistic_norm=True`)
for any non-transformer analysis or display use where FR-2.4/2.5 apply
literally.
"""
from __future__ import annotations

import nltk

_REQUIRED_NLTK_RESOURCES = [
    ("corpora/stopwords", "stopwords"),
    ("corpora/wordnet", "wordnet"),
    ("corpora/omw-1.4", "omw-1.4"),
    ("tokenizers/punkt_tab", "punkt_tab"),
]

_initialized = False
_stopwords: set[str] = set()
_lemmatizer = None


def ensure_nltk_data() -> None:
    global _initialized, _stopwords, _lemmatizer
    if _initialized:
        return
    for resource_path, package_name in _REQUIRED_NLTK_RESOURCES:
        try:
            nltk.data.find(resource_path)
        except LookupError:
            nltk.download(package_name, quiet=True)

    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer

    _stopwords = set(stopwords.words("english"))
    _lemmatizer = WordNetLemmatizer()
    _initialized = True


def remove_stopwords(text: str) -> str:
    """FR-2.4: remove English stop words from already-tokenizable text."""
    ensure_nltk_data()
    tokens = text.split()
    return " ".join(t for t in tokens if t not in _stopwords)


def lemmatize(text: str) -> str:
    """FR-2.5: normalize word forms to their lemma."""
    ensure_nltk_data()
    tokens = text.split()
    return " ".join(_lemmatizer.lemmatize(t) for t in tokens)


def apply_linguistic_normalization(text: str) -> str:
    """Apply stop-word removal then lemmatization, in that order."""
    return lemmatize(remove_stopwords(text))
