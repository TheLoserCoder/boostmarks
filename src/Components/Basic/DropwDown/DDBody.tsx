import React from "react";
import { IDropDownBaseElementProps } from "./interfaces";
import { useDropDownContext } from "./DropDown";
import { Popper } from "@mui/material";

export function DropDownBody(props: IDropDownBaseElementProps)
{
    const {headRef, isOpen} = useDropDownContext();
    return (
        <Popper open = {isOpen} anchorEl={headRef.current}>
            {
                props.children
            }
        </Popper>
    )
}
