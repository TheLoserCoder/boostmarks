import React, { useContext, useEffect, useRef, useState } from "react";
import { DDEvent, IDropDownContext, IDropDownProps } from "./interfaces";
import { DropDownBody } from "./DDBody";
import { DropDownHead } from "./DDHead";

export const DBHead = DropDownHead;
export const DBBody = DropDownBody;

const DropDownContext = React.createContext<IDropDownContext | null>(null);

export function useDropDownContext(): IDropDownContext
{
    return useContext(DropDownContext) as IDropDownContext;
}

export function DropDown(
    {
        children,
        isOpen = false,
        event = DDEvent.Click,
        outerClickClose = false
    }:IDropDownProps)
{
    const [_isOpen, setOpen] = useState<boolean>(isOpen);
    const ref = useRef<HTMLDivElement>(null);
    const headRef = useRef<HTMLDivElement>(null);
    const open = () => setOpen(!_isOpen);
    const close = () => setOpen(false);

    const outerClickHandler = (e: MouseEvent) => {
        const dropDownDiv = ref.current;
        const target = e.target as Node;
        if(dropDownDiv?.contains(target)) return;
        close();
    }

    useEffect(
        () => {
            if(!outerClickClose) return;
            if(isOpen){
                window.addEventListener("click", outerClickHandler)
                return () =>  window.removeEventListener("click", outerClickHandler)
            }
           
        }
    , [isOpen, outerClickClose])

    return (
        <div ref = { ref }>
            <DropDownContext.Provider value = { {headRef, isOpen: _isOpen, open, close, event} }>
            {
                children
            }
            </DropDownContext.Provider>
        </div>
    )
}
