import { ApiKeyArray } from "./const";
import { fetchAllTables } from "./db";
import { checkParams, createStream } from "./socketUtils";
import { parseTableNames, parseQueryString, StringMapToObject } from "./utils";

const server = Bun.serve({
  port: 3000,
  async fetch(req, server) {
    try {
      const url = new URL(req.url);
      const params = parseQueryString(url.searchParams.toString());

      if (
        !params.apiKey ||
        ApiKeyArray.filter((k) => k === params.apiKey).length == 0
      ) {
        server.upgrade(req, {
          data: JSON.stringify({
            error: "wrong api key",
            message: `Sorry, looks like your apiKey is incorrect`,
            apiKey: params.apiKey,
          }),
        });

        return new Response(
          JSON.stringify({
            error: "wrong api key",
            message: `Sorry, looks like your apiKey is incorrect`,
            apiKey: params.apiKey,
          })
        );
      }

      if (url.pathname.includes("info")) {
        const list = await fetchAllTables();
        const { Mpgs, Ticks } = parseTableNames(list);

        return new Response(
          JSON.stringify({
            call: "Fetch Info",
            availableAssets: StringMapToObject(Mpgs),
            availableTicks: Ticks,
          })
        );
      }

      const success = server.upgrade(req, {
        data: JSON.stringify({
          mpg: params.mpg,
          asset: params.asset,
          tick: params.tick,
          shouldContinue: true,
        }),
      });

      if (success) {
        return undefined;
      }

      return new Response(
        JSON.stringify({
          type: "error",
          message:
            "Could not upgrade to Websocket, please make sure to connect using ws:// and not http/s://",
        })
      );
    } catch (error: any) {
      console.error(error);
    }
  },
  websocket: {
    async open(ws) {
      console.log("Connected");
      const data = JSON.parse(ws.data as string);

      if (data.error || data.info) {
        ws.send(JSON.stringify(data));
        ws.close();
      }
    },
    async message(ws, message) {
      ws.data = JSON.stringify({
        shouldContinue: false,
      });
      const params: any = JSON.parse((message as string).replace(/-/g, "_"));
      if (await checkParams(ws, params)) {
        console.log("Listening to ", params.asset);
        ws.data = JSON.stringify({
          mpg: params.mpg,
          asset: params.asset,
          tick: params.tick,
          shouldContinue: true,
        });

        const stream = createStream(ws);
        stream.start();
      }
    },
    close(ws) {
      ws.data = JSON.stringify({
        shouldContinue: false,
      });
    },
  },
});

console.log(`Listening on ${server.hostname}:${server.port}`);
