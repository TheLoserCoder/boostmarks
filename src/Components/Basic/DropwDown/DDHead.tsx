import React from "react";
import { useDropDownContext } from "./DropDown";
import { DDEvent, IDropDownBaseElementProps, IDropDownContext } from "./interfaces";


export function DropDownHead(props: IDropDownBaseElementProps)
{
    const {open, event, headRef} : IDropDownContext = useDropDownContext();

    const click = () => {
        if(event != DDEvent.Click) return;
        open();
    }
    const hover = () => {
        if(event != DDEvent.Hover) return;
        open();
    }

    return (
        <div ref = {headRef} onClick= {click} onMouseEnter = {hover} onMouseLeave = {hover} >
            {
                props.children
            }
        </div>
    )
}