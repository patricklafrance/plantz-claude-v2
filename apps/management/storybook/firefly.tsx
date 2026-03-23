/**
 * Squide Firefly helpers for Storybook.
 *
 * Builder-agnostic replacement for @squide/firefly-rsbuild-storybook.
 * Provides the same API but typed for @storybook/react-vite.
 */

import { EnvironmentVariablesPlugin, type EnvironmentVariables } from "@squide/env-vars";
import { AppRouter, FireflyProvider, FireflyRuntime, type FireflyRuntimeOptions, FireflyRuntimeScope, InMemoryLaunchDarklyClient, type ModuleRegisterFunction, toLocalModuleDefinitions } from "@squide/firefly";
import { LaunchDarklyPlugin, type FeatureFlags, isEditableLaunchDarklyClient, useLaunchDarklyClient } from "@squide/launch-darkly";
import { MswPlugin } from "@squide/msw";
import type { Decorator } from "@storybook/react-vite";
import type { RootLogger } from "@workleap/logging";
import type { LDClient } from "launchdarkly-js-client-sdk";
import { type PropsWithChildren, useEffect, useRef } from "react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

// --- StorybookRuntime ---

class StorybookRuntime extends FireflyRuntime {
    constructor(options: FireflyRuntimeOptions = {}) {
        super(options);
    }

    override registerRoute() {
        // Ignore routes registration — doesn't matter for a Storybook host application.
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    override startScope(logger: any) {
        return new StorybookRuntimeScope(this, logger);
    }
}

class StorybookRuntimeScope extends FireflyRuntimeScope {}

// --- initializeFireflyForStorybook ---

interface InitializeFireflyForStorybookOptions {
    localModules?: ModuleRegisterFunction<FireflyRuntime>[];
    environmentVariables?: EnvironmentVariables;
    featureFlags?: Partial<FeatureFlags>;
    launchDarklyClient?: LDClient;
    loggers?: RootLogger[];
    useMsw?: boolean;
}

export async function initializeFireflyForStorybook(options: InitializeFireflyForStorybookOptions = {}): Promise<StorybookRuntime> {
    const { localModules = [], environmentVariables, featureFlags = {}, launchDarklyClient, loggers, useMsw = true } = options;

    const plugins: FireflyRuntimeOptions["plugins"] = [(x) => new EnvironmentVariablesPlugin(x, { variables: environmentVariables }), (x) => new LaunchDarklyPlugin(x, launchDarklyClient ?? new InMemoryLaunchDarklyClient(featureFlags))];

    if (useMsw) {
        plugins.push((x) => new MswPlugin(x));
    }

    const runtime = new StorybookRuntime({
        mode: "development",
        plugins,
        loggers,
    });

    if (localModules.length > 0) {
        await runtime.moduleManager.registerModules([...toLocalModuleDefinitions(localModules)]);
    } else {
        runtime.moduleManager.setAsReady();
    }

    return runtime;
}

// --- withFireflyDecorator ---

interface FireflyDecoratorProps extends PropsWithChildren {
    runtime: FireflyRuntime;
}

function FireflyDecorator({ runtime, children: story }: FireflyDecoratorProps) {
    return (
        <FireflyProvider runtime={runtime}>
            <AppRouter strictMode={false}>
                {({ rootRoute, routerProps, routerProviderProps }) => <RouterProvider router={createMemoryRouter([{ element: rootRoute, children: [{ path: "/story", element: story }] }], { ...routerProps, initialEntries: ["/story"] })} {...routerProviderProps} />}
            </AppRouter>
        </FireflyProvider>
    );
}

export function withFireflyDecorator(runtime: FireflyRuntime): Decorator {
    return (story) => <FireflyDecorator runtime={runtime}>{story()}</FireflyDecorator>;
}

// --- withFeatureFlagsOverrideDecorator ---

function OverrideFeatureFlags({ overrides, children }: PropsWithChildren<{ overrides: Partial<FeatureFlags> }>) {
    const transactionRef = useRef<{ undo: () => void } | undefined>(undefined);
    const client = useLaunchDarklyClient();

    if (!transactionRef.current) {
        if (!isEditableLaunchDarklyClient(client)) {
            throw new Error("[squide] The withFeatureFlagsOverrideDecorator hook can only be used with an EditableLaunchDarklyClient instance.");
        }
        transactionRef.current = client.startTransaction();
        client.setFeatureFlags(overrides);
    }

    useEffect(() => {
        return () => {
            transactionRef.current?.undo();
            transactionRef.current = undefined;
        };
    }, [transactionRef]);

    return children;
}

function withFeatureFlagsOverrideDecorator(overrides: Partial<FeatureFlags>): Decorator {
    return (story) => <OverrideFeatureFlags overrides={overrides}>{story()}</OverrideFeatureFlags>;
}
