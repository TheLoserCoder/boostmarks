import React, { useRef, useState } from "react";
import { Menu, MenuItem } from "@mui/material";
import {Button} from "@mui/material";

const Pages = ["Bookmark", "Tags", "Domains"]

export default function PageNavMenu()
{
    const anchorRef = useRef<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState<boolean>(false);
    const onClick = () => setOpen(!open);
    return( 
        <div>
            <Button ref = {anchorRef} {...{onClick}}>
                Bookmark
            </Button>
            <Menu open = {open} onClose ={onClick} anchorEl={anchorRef.current}>
                {
                    Pages.map(
                        val => <MenuItem key = {val}>{val}</MenuItem>
                    )
                }
            </Menu>
        </div>
    )
}