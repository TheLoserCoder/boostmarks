
export type EventHandler = (data: any) => void;

export interface IEventsMap{
    [eventName:string]: EventHandler[]
}

export default class EventEmitter
{
    protected eventsMap:IEventsMap = {};
    protected verify(eventName:string)
    {
        if(!this.eventsMap[eventName]) throw Error("No handler for this event");
    }
    public on(eventName: string, handler: EventHandler) : any
    {
        if(this.eventsMap[eventName]){
            this.eventsMap[eventName].push(handler);
        }else{
            this.eventsMap[eventName] = [handler];
        }
    }
    public emit(eventName:string, data: any)
    {
        this.verify(eventName);
        this.eventsMap[eventName].forEach( handler => handler(data) )
    }
    public remove(eventName:string, handler?:EventHandler)
    {
        this.verify(eventName);
        if(handler){
            this.eventsMap[eventName] =  this.eventsMap[eventName].filter( 
                    h => h != handler
                )
        }else{
            delete this.eventsMap[eventName];
        }
    }
    public once(eventName:string, handler:EventHandler)
    {
        const cb = (data: any) => {
            this.remove(eventName, handler);
            handler(data);
        }
        this.on(eventName, cb);
    }
}
