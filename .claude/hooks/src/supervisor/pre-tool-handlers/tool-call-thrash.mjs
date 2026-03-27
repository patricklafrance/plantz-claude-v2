import checkToolCallThrash from "../policies/tool-call-thrash.mjs";

export default function handleToolCallThrash(context) {
    return checkToolCallThrash(context.event, context.nextState);
}
