import EventEmitter from "events";

export class WaveSyncEvent  {
    protected emitter: EventEmitter;
    
    constructor() {
        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(50); 
    }

    listen(event_name: string, listener: (...args: any[]) => void) {
        this.emitter.on(event_name, listener);
    }

    listen_once(event_name: string, listener: (...args: any[]) => void) {
        this.emitter.once(event_name, listener);
    }

    remove_listener(event_name: string, listener: (...args: any[]) => void) {
        this.emitter.off(event_name, listener);
    }

    emit(event_name: string, value: any) {
        this.emitter.emit(event_name, value);
    }
}