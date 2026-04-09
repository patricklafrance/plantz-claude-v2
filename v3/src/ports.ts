import { PORT_BASE } from "./config.js";

export interface Ports {
    storybook: number;
    hostApp: number;
    browser: number;
}

/** Allocate non-overlapping ports for a slice running in position `index` within a wave. */
export function allocatePorts(index: number): Ports {
    return {
        storybook: PORT_BASE.storybook + index,
        hostApp: PORT_BASE.hostApp + index,
        browser: PORT_BASE.browser + index
    };
}
