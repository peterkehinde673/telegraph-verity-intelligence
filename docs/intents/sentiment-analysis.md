# SENTIMENT_ANALYSIS

The live Telegraph registry confirms `SENTIMENT_ANALYSIS` as canonical and currently lists 19 miners (checked 2026-10-19). Its description says the input supplies text and asks for sentiment or emotional tone. It distinguishes that task from category labeling (`TEXT_CLASSIFICATION`).

Telegraph's [intent documentation](https://docs.telegraphprotocol.com/docs/using/intents) does not publish an intent-specific JSON schema. The request and response fields below are Verity's local API contract.

## Verity request

```json
{
  "intent": "SENTIMENT_ANALYSIS",
  "input": {
    "text": "The service was helpful and the result arrived quickly."
  }
}
```

The text must be non-empty and no longer than 4,000 characters. Invalid inputs are rejected without provider access.

## Classifier and limits

When a server-side `HF_TOKEN` is configured, Verity calls Hugging Face's `hf-inference` text-classification provider with CardiffNLP's [`twitter-roberta-base-sentiment-latest`](https://huggingface.co/cardiffnlp/twitter-roberta-base-sentiment-latest) model. Hugging Face currently identifies this model as a recommended text-classification model specialized for tweets; its model card says it is suitable for English and trained on social-media text. The live Hub model metadata reported a `hf-inference` mapping with status `live` on 2026-10-19. The model outputs negative, neutral, and positive classes. This implementation reports polarity only and does not claim to distinguish discrete emotions such as anger, fear, or joy.

The request is a JSON `POST` to `https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-roberta-base-sentiment-latest`, with `{ "inputs": text, "parameters": { "function_to_apply": "softmax", "top_k": 3 } }`, as specified by Hugging Face's [text-classification task API](https://huggingface.co/docs/inference-providers/tasks/text-classification) and official [JavaScript inference client implementation](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/providers/hf-inference.ts). The credential is an `HF_TOKEN` with Inference Providers permission. No live inference call was made; tests use mocked responses only.

The response records the model identifier and card URL, all three class scores, and the retrieval timestamp. The top model score is passed through as `confidence`, but is explicitly marked uncalibrated in the uncertainty list. A top score below 0.55 yields an `uncertain` verdict; this fixed threshold is a conservative presentation rule, not a validated calibration threshold. Model performance may differ on non-English text, other domains, sarcasm, or context-dependent language. The input text is sent to the configured external inference service; do not send data that must remain local.

Hugging Face's [pricing documentation](https://huggingface.co/docs/inference-providers/pricing) says users receive monthly included credits (currently $0.10 for free users, subject to change) and can make pay-as-you-go calls after credits, with additional use requiring purchased credits. Check current account terms and limits before configuring a token. No credential value was inspected or committed.

Without a configured token, on provider failure, or on a malformed response, the handler abstains with `insufficient_evidence`; it never fabricates a label. The adapter has a ten-second timeout, 64 KiB response cap, no-redirect policy, validated score labels/ranges, and sanitized errors.

## Manifest status

`SENTIMENT_ANALYSIS` is implemented in the local catalogue and tested, but remains out of `miner.yaml` and `miner.yaml.template`. Telegraph does not publish the per-intent schema, and Integrate's ability to construct `{ intent, input: { text } }` plus current YAML validation remain unverified. The implementation performs three-way sentiment polarity only, not a broad emotion taxonomy.
