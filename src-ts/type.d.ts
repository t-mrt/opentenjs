declare namespace Ten {
    interface Class {
        (...args): void
    }
    interface Widget {
        OptionButtons: OptionButtons
        ItemList: ItemList
        Frame: Frame
        DropDown: DropDown
    }
    interface DropDown {
        (): void
        FrameMenu: FrameMenu
    }
    interface FrameMenu {
        (a): void
        prototype
        setup(ancestor)
    }
    interface Frame {
        iframeMap
        Listener: Listener
    }
    interface Listener {
        (panel): void
    }
    interface OptionButtons {}
    interface ItemList {
        prototype

    }
    interface Timer {
        (a): void
    }
    interface EventDispatcher {
        implementEventDispatcher(t)
    }
    interface TextArea {
        insertText: any;
    }
    interface SubWindow {
        _baseStyle: any
        _baseScreenStyle: any
    }
    interface Style {
        applyStyle(div, style): void
        insertStyleRules: any
        StyleSheet: StyleSheet
        getElementStyle(window, a)
    }
    interface StyleSheet {
        IE
        Opera
        Safari
    }
    interface Draggable {
        (div, h): void
    }
    interface Observer {
        (a, a2: string, a3, a4?: string): void
    }
    interface Geometry {
        getScroll(): any
        getElementPosition(a1): any;
        setScroll(pos)
        getWindowSize()
    }
    interface Position {
        subtract(a1, a2): any;
    }
    interface Browser {
        isIE: any
        isOpera
        isWebKit
        leIE7
        isIE6
        isDSi
        isWii
    }
    interface AsyncLoader {
        insert(style): void
        _callbackCode
        loadScripts(a, c)
        pageFragmentLoader(a1, a2?)
        PageFragmentLoader: PageFragmentLoader
        tryToExecute(c)
        isDOMContentLoadedFired: boolean
        _OnDOMContentLoaded()
        isLoadFired: boolean
        _OnLoad()
        isPageshowFired: boolean
        _OnPageshow()
        Indicator: Indicator
        _OnFragmentLoaded(value)
    }
    interface Indicator {
        start(a)
        stop(a)
    }
    interface PageFragmentLoader {
        JSONData: JSONData
        HTTPData: HTTPData
        TextData: TextData
    }
    interface TextData {
        (text): void
    }
    interface HTTPData {
        (xhr): void
    }
    interface JSONData {
        (a): void
    }
    interface PageFragmentLoader {
        (a1 ,a2): void
    }

    interface Element {
        (style:string, o, e?): void
    }
    interface DOM {
        removeAllChildren(styleSheet)
        replaceNode(n1, n2)
        getElementsByStructure(root, structure)
        getElementsByClassName(className, root)
        getElementSetByClassNames(o, r?)
        getAncestorByClassName(fr, r)
        addClassName(a1, a2)
        removeClassName(a1, a2)
        hasClassName(el, name);
    }
    interface Storage {
        Local: Local
    }
    interface Resizable {}
    interface Selector {
        getElementsBySelector(a, window)
    }
    interface JSON {
        parse(text)
    }
    interface IFrameMessenger {
        Base: Base
        Manager: Manager
        Client: Client
        FragmentDispatcher: FragmentDispatcher
    }
    interface Base {}
    interface Manager {
        dispatchEvent(e: string)
    }
    interface Client {}
    interface FragmentDispatcher {}
    interface Highlight {
        highlighted
    }
    interface Color {
        (a1: number, a2: number, a3: number, a4?: number): void
        parseFromElementColor(node, t)
    }
    interface Form  {
        Placeholder: Placeholder
        createDataSetArray(a)
        arrayToPostData(params)
    }
    interface Placeholder {
        hasBfcache
    }
    interface Extras {
        XHR: XHR
    }
    interface XHR {
        (url, f1, f2): void
        ErrorXHR: ErrorXHR
    }
    interface ErrorXHR {
        (e): void
    }
    interface Box {}
    interface Array {
        forEach(s, c)
    }
    interface Deferred {
        (): void
        ok(x)
        ng(x)
        onerror
        next_default(fun): any
        next_faster_way_readystatechange
        next_faster_way_Image
        next_tick
        next(a?)
        chain
        parallel
        earlier
        loop
        repeat
        register(s: string, d)
        connect
        Arguments: Arguments
        retry
        define
        methods
        wait
    }
    interface Arguments {
        (a): void
    }
    interface Local {}
    interface Cookie {
        (): void
    }
    interface Static {
        _stash: {
            lastPos:any
        }
        querySelectorAll(selectors, div)
        Class: Class
        Widget: Widget
        Timer: Timer
        EventDispatcher: EventDispatcher
        TextArea: TextArea
        SubWindow: SubWindow
        Style: Style
        Draggable: Draggable
        Observer: Observer
        Geometry: Geometry
        Position: Position
        Browser: Browser
        AsyncLoader: AsyncLoader
        Element: Element
        DOM: DOM
        Storage: Storage
        Resizable: Resizable
        Selector: Selector
        JSON: JSON
        IFrameMessenger: IFrameMessenger
        Highlight: Highlight
        Color: Color
        Form: Form
        Extras: Extras
        Box: Box
        Array: Array
        Deferred: Deferred
        Cookie: Cookie
    }

}


declare var Ten: Ten.Static;

interface Window {
    opera: any;
    JSON
    globalStorage
    TenExtrasOnLoadFunctions
}

interface Document {
    selection:any
    createStyleSheet(style?: string)
}

interface HTMLScriptElement {
    onreadystatechange
    readyState
}

interface  HTMLLIElement{
    tenItemListIndex
 }

 interface Node {
     data
 }

 interface Function {
    _prev_timeout_called
 }

declare var p
declare var css
declare var args
declare var process
