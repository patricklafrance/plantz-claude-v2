import checkRepeatedEdit from "../policies/repeated-edit.mjs";

export default function handleRepeatedEdit(context) {
    return checkRepeatedEdit(context.event, context.nextState);
}
