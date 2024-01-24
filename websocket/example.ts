const apiKey = '239asH3yR2K2onO0S21-example-api-key'

type WebSocketParams = {
    mpg: string;
    asset: string;
    tick: string;
};

class ManagedWebSocket {
    private ws: WebSocket | null = null;
    private params: WebSocketParams | null;

    constructor(params?: WebSocketParams | null) {
        this.params = params ?? null;
    }

    private connect() {
        this.ws = new WebSocket(`ws://localhost:3000/candles?apiKey=${apiKey}`);

        this.ws.onopen = () => {
            console.log("Connected to the WebSocket server.");
            if (this.params){
                this.sendParams(this.params);
            }
        };

        this.ws.onmessage = (event) => {
            console.log(JSON.parse(event.data.toString()));
        };

        this.ws.onerror = (error) => {
            console.error(`WebSocket Error: ${error}`);
        };

        this.ws.onclose = (event) => {
            if (event.wasClean) {
                console.log(`Closed cleanly, code=${event.code}, reason=${event.reason}`);
            } else {
                console.error('Connection died');
            }
        };
    }

    public start() {
        if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
            this.connect();
        }
    }

    public switchParams(newParams: WebSocketParams) {
        this.params = newParams;
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendParams(newParams);
        }
    }

    private sendParams(params: WebSocketParams) {
        if (this.ws) {
            this.ws.send(JSON.stringify(params));
        }
    }
    
    public close() {
        if (this.ws) {
            this.ws.close(1000, "Done");
            this.ws = null;
        }
    }
}

const webSocketManager = new ManagedWebSocket({
    mpg: 'bluechip',
    asset: 'btcusd-perp',
    tick: '1-h'
});

webSocketManager.start()

setTimeout(() => {
    webSocketManager.switchParams({
        mpg: 'stakechip',
        asset: 'jsol-msol',
        tick: '1-m'
    });
}, 3500)

setTimeout(() => {
    webSocketManager.close()
}, 3500)