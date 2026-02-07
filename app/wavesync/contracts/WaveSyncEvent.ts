export interface WaveSyncEvent {
    listen: (event_name: string, listener: (...args: any[]) => void) => void;
    listen_once: (event_name: string, listener: (...args: any[]) => void) => void;
    remove_listener: (event_name: string, listener: (...args: any[]) => void) => void;
    emit: (event_name: string, value: any) => void;
}
