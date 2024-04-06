import uniqid from "uniqid";
import EventEmitter from "./EventEmitter";

const browser = window.chrome || (window as any).browser;

enum MessageType{
    Request = 0,
    Response = 1
};

type Port = chrome.runtime.Port;
interface IMessage {eventName: string, type: MessageType, data: any, id: string};

class SCPort extends EventEmitter{
    private port!: Port;
    public get nativePort() {return this.port};

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

    private async onMessage( {id, data, type, eventName}: IMessage, port: Port)
    {

        if(type == MessageType.Request){
            this.emit(eventName, 
                {
                    data, 
                    sendResponse: (data:any) : void => 
                        this.postMessage({data, 
                                            id, 
                                            type: MessageType.Response,
                                            eventName})
                })
        }

        if(type == MessageType.Response){
            this.emit(id, data);
        }
       
    }

    public sendMessage(eventName: string, data: any) : Promise<any>
    {
        const id = uniqid();
      
        this.postMessage({id, type: MessageType.Request, data, eventName});

        return new Promise((res) => {
             this.once(id, res);
        })
    }

    public disconnect()
    {
        this.port.disconnect();
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
