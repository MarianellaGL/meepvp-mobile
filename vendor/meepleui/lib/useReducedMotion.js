"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useReducedMotion = useReducedMotion;
const react_1 = require("react");
const react_native_1 = require("react-native");
function useReducedMotion() {
    const [reduced, setReduced] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        let mounted = true;
        react_native_1.AccessibilityInfo.isReduceMotionEnabled().then((value) => {
            if (mounted)
                setReduced(value);
        }).catch(() => undefined);
        const subscription = react_native_1.AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
        return () => {
            mounted = false;
            subscription.remove();
        };
    }, []);
    return reduced;
}
//# sourceMappingURL=useReducedMotion.js.map