
export type EventHandler<DataType> = (data: DataType) => any;
export type EventName = string | number;

export interface IEventsMap<DataType>{
    [eventName:EventName]: EventHandler<DataType>[]
}

export default class EventEmitter<DataType>
{
    protected eventsMap:IEventsMap<DataType> = {};
    protected verify(eventName:EventName)
    {
        if(!this.eventsMap[eventName]) throw Error("No handler for this event");
    }
    public on(eventName: EventName, handler: EventHandler<DataType>) : any
    {
        if(this.eventsMap[eventName]){
            this.eventsMap[eventName].push(handler);
        }else{
            this.eventsMap[eventName] = [handler];
        }
    }
    public emit(eventName:EventName, data: DataType)
    {
        this.verify(eventName);
        this.eventsMap[eventName].forEach( handler => handler(data) )
    }
    public exhaustEmit(eventName:EventName, data: DataType)
    {
        this.verify(eventName);
        return this.eventsMap[eventName].map( handler => handler(data) )
    }
    public remove(eventName:EventName, handler?:EventHandler<DataType>)
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
    public once(eventName:EventName, handler:EventHandler<DataType>)
    {
        const cb = (data: any) => {
            this.remove(eventName, handler);
            handler(data);
        }
        this.on(eventName, cb);
    }
}
