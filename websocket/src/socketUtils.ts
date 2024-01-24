import { ServerWebSocket } from "bun";
import { fetchAllTables, fetchPricesBy } from "./db";
import { StringMapToObject, parseTableNames } from "./utils";

export function createStream(ws: ServerWebSocket<unknown>) {

    async function stream() {
        const data = JSON.parse(ws.data as string)
        if (!data.shouldContinue) return ws.close();

        const candles = await fetchPricesBy(data.mpg, data.asset, data.tick)

        ws.send(JSON.stringify({
            type: 'data',
            asset: data.asset,
            time: data.time,
            candles
        }));

        setTimeout(stream, 500);
    }

    function start() {
        stream();
    }

    function close() {
        ws.data = JSON.stringify({
            shouldContinue: false
        })
    }

    return {
        start: start,
        close: close
    };
}

export async function checkParams(ws: ServerWebSocket<unknown>, params: any) {
    try {

        const list = await fetchAllTables()
        const { Mpgs, Ticks } = parseTableNames(list)

        const AssetsInMpg = Mpgs.get(params.mpg) ?? undefined

        if (!AssetsInMpg) {
            ws.send(JSON.stringify({
                error: 'wrong mpg',
                message: `Sorry, looks like that the MPG requested is wrong or not available at the moment`,
                mpg: params.mpg,
                availableMpgsAndAssets: StringMapToObject(Mpgs),
            }))
            return false
        }

        if (!AssetsInMpg?.has(params.asset)) {
            ws.send(JSON.stringify({
                error: 'wrong asset',
                message: `Sorry, looks like that the Asset requested is not in the MPG you selected`,
                assset: params.asset,
                mpg: params.mpg,
                availableMpgsAndAssets: StringMapToObject(Mpgs),
            }))
            return false
        }

        if (!Ticks.includes(params.tick)) {
            ws.send(JSON.stringify({
                error: 'wrong tick',
                message: `Sorry, looks like that the Tick selected is not available for the selected Asset`,
                assset: params.asset,
                mpg: params.mpg,
                tick: params.tick,
                availableTicks: Ticks
            }))
            return false
        }

        return true

    } catch (error) {
        ws.send(JSON.stringify(
            {
                error: 'failed to check params',
                params
            }
        ))
    }
}