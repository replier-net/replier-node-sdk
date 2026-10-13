# replier-sdk (Node.js / TypeScript)

Node.js SDK for the [Replier.net](https://www.replier.net) WhatsApp API.
Zero runtime dependencies. Uses the built-in `fetch` (Node 18+). Ships ESM, CommonJS and TypeScript types.

## Install

```bash
npm install replier-sdk
```

## Usage

```ts
import { Replier, ReplierError } from 'replier-sdk';
// const { Replier } = require('replier-sdk');

const replier = new Replier({
  instanceId: process.env.REPLIER_INSTANCE_ID,
  token: process.env.REPLIER_TOKEN,
  // only for listInstances / newInstance / renewInstance:
  email: process.env.REPLIER_EMAIL,
  apiKey: process.env.REPLIER_API_KEY,
});

try {
  const sent = await replier.sendMessage('15551234567', 'Hello!');
  console.log(sent.id);

  await replier.sendFile('15551234567', 'https://example.com/invoice.pdf', 'invoice.pdf', 'Your invoice');
  await replier.createGroup('Team', ['15551234567', '15557654321']);
  await replier.setWebhook('https://example.com/replier/webhook');
} catch (err) {
  if (err instanceof ReplierError) console.error(err.errorCode, err.message);
  else throw err;
}
```

Call an endpoint that is not wrapped yet:

```ts
await replier.call('someNewEndpoint', { param: 'value' });
```

See the [method reference](../README.md#method-reference) for the full list.

## Build & publish

```bash
npm install
npm run build
npm publish
```

## License

MIT
