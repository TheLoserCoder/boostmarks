import uniqid from "uniqid";
import EventEmitter, {EventName} from "./EventEmitter";

const browser = window.chrome || (window as any).browser;

enum MessageType{
    Request = 0,
    Response = 1
};

type Port = chrome.runtime.Port;

interface IMessage{
    eventName: EventName, 
    type: MessageType, 
    data: any, 
    id: string
    noResponse?: Boolean
};


interface IMHandler<DataType>{
    ({data, sendResponse} : {data: DataType,   sendResponse?: (data: any) => void}) : any
}

class SCPort extends EventEmitter<any>
{
    private port!: Port;
    public readonly nativePort = this.port;

    constructor(private name: string){
        super();
        this.initPort();
    };

    private initPort( )
    {
        this.port = browser.runtime.connect({name: `${this.name}-${uniqid()}`});
        this.port.onMessage.addListener(this.onMessage.bind(this));
        this.port.onDisconnect.addListener(this.onDisconnect.bind(this));
    }
   
    private onDisconnect(port: Port)
    {
        try{
            this.emit("disconnect", port);
        }catch(e){
            console.warn(`Port ${port.name} was disconnect! Please use port.on('disconnect', handler) to trace disconnection`)
        }
       
    }
    private postMessage(message: IMessage)
    {
        try{    
            this.port.postMessage(message);
        }catch(e){
            this.initPort();
            this.port.postMessage(message);
        }
    }

    private sendResponse(message: IMessage, ref: {flag:Boolean})
    {
        if(ref.flag || message.noResponse) return;
        ref.flag = true;
        this.postMessage(message)
    }

    private async onMessage(  message: IMessage, port: Port)
    {
        const {id, data, type, eventName, noResponse} = message;
        if(type == MessageType.Request){
            const responseRef = {flag:false};
            const resArr : any[] = await Promise.all(
                this.exhaustEmit(
                        eventName, 
                        {
                            data, 
                            sendResponse: (data: any) => this.sendResponse(
                                {   
                                    ...message,
                                    data, 
                                    type: MessageType.Response,
                                },
                                responseRef
                            )
                        }
                    )
                );

            const res : any | any[] = resArr.length == 1 ? resArr[0] : resArr;
            this.sendResponse(
                {
                    ...message,
                    data: res,
                    type: MessageType.Response
                },
                responseRef
            );
            
        }

        if(type == MessageType.Response && !noResponse){
            this.emit(id, data);
        }
       
    }

    public sendMessage(eventName: EventName, data: any, noResponse?: Boolean) : Promise<any> | void
    {
        const id = uniqid();
      
        this.postMessage({id, type: MessageType.Request, data, eventName, noResponse});

        if(noResponse) return;

        return new Promise((res) => {
             this.once(id, res);
        })
    }

    public disconnect()
    {
        this.port.disconnect();
    }
    public on<DataType>(
        eventName: EventName,
        handler: IMHandler<DataType>
    ) {
        super.on(eventName, handler);
    }
}


export default class SConnection{
    [channelName:string] : SCPort;
    constructor(channels: string[])
    {
        for(let channelName of channels){
            this[channelName] = new SCPort(channelName);
        }
    }
    
}
