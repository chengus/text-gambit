# Text Gambit

Your texts, reviewed like a chess game.

## Run locally

Use Node.js 22 or newer. No dependencies need to be installed.

```sh
npm start
```

Open http://127.0.0.1:8787. Use **←** and **→** or the on-screen arrows to replay the built-in example one message at a time. **Try sample** fills both the goal and chat history with the example. When your browser has a local English voice, the analyst’s speaker button turns on built-in narration. Voice is off by default.

To enable live reviews, set `OPENROUTER_API_KEY` in `.dev.vars` using your OpenRouter key, then restart the server. If `.dev.vars` is missing, copy `.dev.vars.example` to `.dev.vars` first. `OPENROUTER_MODEL` defaults to `deepseek/deepseek-v4.1-flash-1017:floor`. OpenRouter's [`:floor` routing](https://openrouter.ai/docs/guides/routing/model-variants/floor) sorts eligible endpoints by price, including eligible flex endpoints. Text Gambit validates each review before returning it. The built-in sample also works without a key.

Enter a goal in the **Goal** field, such as “Agree on a time for coffee.” Paste messages from two labeled speakers into **Chat history**. Use `Me:` for your messages, or enter `Goal (Name):` followed by your goal in the goal field to use a different label. Indent a continuation line that contains a colon so it is read as part of the current message.

```text
Me: Want to grab coffee Saturday?
Sam: Saturday works.
Me: How about 2?
Sam: See you then!
```

Custom reviews send the conversation to OpenRouter and the model provider it selects. Text Gambit does not persist or log transcripts. The local key file is ignored by Git.

`npm run build` bundles the page into `dist/server/index.js`. The local Node server serves the same Fetch handler exported by the bundle.
