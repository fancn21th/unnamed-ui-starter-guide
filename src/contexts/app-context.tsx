import {
    createContext, type ReactNode,
    useContext,
    useMemo,
    useState,
} from "react"

export type AppContextValue = {
    showCanvas: boolean
    setShowCanvas: (show: boolean) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export const AppProvider = ({children}: { children: ReactNode }) => {
    const [showCanvas, setShowCanvas] = useState<boolean>(false)


    const providerValue = useMemo(
        () => ({
            showCanvas,
            setShowCanvas,
        }),
        [
            showCanvas,
            setShowCanvas,
        ]
    )

    return (
        <AppContext.Provider value={providerValue}>{children}</AppContext.Provider>
    )
}

/**
 * Hook to access the app state.
 * @returns {AppContextValue}
 */
export const useAppState = (): AppContextValue => {
    const context = useContext(AppContext)
    if (!context) {
        throw new Error("useAppState must be used within an AppProvider")
    }
    return context
}
