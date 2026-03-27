import checkBrowserThrash from "../policies/browser-thrash.mjs";

export default function handleBrowserThrash(context) {
    return checkBrowserThrash(context.event, context.nextState);
}
