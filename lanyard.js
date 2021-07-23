"use strict";

class Lanyard {

    #version = "1.1";
    #author = "XARON";
    #socket = "wss://api.lanyard.rest/socket";
    #api = "https://api.lanyard.rest/v1/users/";
    #opCodes = {
        INFO: 0,
        HELLO: 1,
        INIT: 2,
        HEARTBEAT: 3,
    }

    constructor(id, compress = false) {
        if (!id) return;
        this.id = id;
        this.#socket = (compress ? this.#socket + "?compression=zlib_json" : this.#socket);
        console.log("[Lanyard] Construct success. (JS-Lanyard/" + this.#version + " by " + this.#author + ")");
    }

    on(type, x) {
        const supportsWebSocket = "WebSocket" in window || "MozWebSocket" in window;
        if (!supportsWebSocket) throw new Error("Browser doesn't support WebSocket connections.");
        this.#socket = new WebSocket(this.#socket);
        this.#socket.onmessage = ({
            data
        }) => {
            const parsedData = JSON.parse(data);
            switch (type) {
                case "INIT_STATE":
                    switch (parsedData.op) {
                        case this.#opCodes.HELLO:
                            this.#socket.send(JSON.stringify({
                                op: this.#opCodes.INIT,
                                d: {
                                    subscribe_to_id: this.id
                                }
                            }));
                            setInterval(() => {
                                this.#socket.send(JSON.stringify({
                                    op: this.#opCodes.HEARTBEAT
                                }))
                            }, parsedData.d.heartbeat_interval);
                            break;
                        case this.#opCodes.INFO:
                            x({
                                "id": parsedData.d.discord_user.id,
                                "username": parsedData.d.discord_user.username + "#" + parsedData.d.discord_user.discriminator,
                                "avatar": parsedData.d.discord_user.avatar,
                                "status": parsedData.d.discord_status,
                                "activities": (parsedData.d.activities.length <= 0 ? null : parsedData.d.activities),
                                "listening": parsedData.d.spotify
                            })
                            break;
                    }
                    break;
                case "PRESENCE_UPDATE":
                    switch (parsedData.op) {
                        case this.#opCodes.HELLO:
                            this.#socket.send(JSON.stringify({
                                op: this.#opCodes.INIT,
                                d: {
                                    subscribe_to_id: this.id
                                }
                            }));
                            setInterval(() => {
                                this.#socket.send(JSON.stringify({
                                    op: this.#opCodes.HEARTBEAT
                                }))
                            }, parsedData.d.heartbeat_interval);
                            break;
                        case this.#opCodes.INFO:
                            x({
                                "status": parsedData.d.discord_status
                            })
                            break;
                    }
                    break;
                case "ALL":
                    switch (parsedData.op) {
                        case this.#opCodes.HELLO:
                            this.#socket.send(JSON.stringify({
                                op: this.#opCodes.INIT,
                                d: {
                                    subscribe_to_id: this.id
                                }
                            }));
                            setInterval(() => {
                                this.#socket.send(JSON.stringify({
                                    op: this.#opCodes.HEARTBEAT
                                }))
                            }, parsedData.d.heartbeat_interval);
                            break;
                        case this.#opCodes.INFO:
                            x(parsedData.d);
                            break;
                    }
                    break;
                default:
                    throw new Error("Invalid event type. (Available events: [INIT_STATE, PRESENCE_UPDATE, ALL])");
            }

        }
    }

    async fetch(id = null) {
        const url = (id ? this.#api + id : this.#api + this.id);
        let data = null;
        await fetch(url).then(response => response.json()).then((response) => {
            data = response;
        }).catch((err) => {
            data.error.message = err;
        });
        return (data.success ? data.data : data.error.message);
    }

}
