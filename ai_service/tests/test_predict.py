import numpy as np
import pytest

from ai_service.bert_model import predict


def test_resolve_current_model_dir_raises_clear_error_when_untrained(monkeypatch, tmp_path):
    monkeypatch.setattr(predict, "CLASSIFIER_DIR", tmp_path)
    with pytest.raises(predict.ModelNotTrainedError):
        predict.resolve_current_model_dir()


@pytest.mark.slow
class TestPredictProbaBatch:
    """Runs against the shipped ONNX classifier (models_store/classifier/)."""

    def test_returns_correct_shape(self):
        probs = predict.predict_proba_batch(["a normal job posting", "urgent pay a fee now"])
        assert probs.shape == (2, 2)
        assert np.allclose(probs.sum(axis=1), 1.0, atol=1e-5)

    def test_accepts_numpy_object_array(self):
        # Regression: shap's Text masker calls this with a numpy array of
        # dtype=object, not a plain list — a bare `tokenizer(list_slice)`
        # rejects numpy-array slices with a ValueError.
        texts = np.array(["a normal job posting", "urgent pay a fee now"], dtype=object)
        probs = predict.predict_proba_batch(texts)
        assert probs.shape == (2, 2)
