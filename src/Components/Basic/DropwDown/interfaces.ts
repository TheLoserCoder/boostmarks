export enum DDEvent{
    Click = "click",
    Hover = "hover"
}
export interface IDropDownContext  {
    isOpen: boolean,
    open: () => void,
    close: () => void,
    headRef: React.RefObject<HTMLDivElement>,
    event: DDEvent
}


export interface IDropDownBaseElementProps{
    children?: React.ReactNode,
}

export interface IDropDownProps extends IDropDownBaseElementProps{
    isOpen?: boolean,
    outerClickClose?: boolean,
    event?: DDEvent
}
