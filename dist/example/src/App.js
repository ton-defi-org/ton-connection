"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_svg_1 = __importDefault(require("./assets/react.svg"));
require("./App.css");
function App() {
    const [count, setCount] = (0, react_1.useState)(0);
    return (React.createElement("div", { className: "App" },
        React.createElement("div", null,
            React.createElement("a", { href: "https://vitejs.dev", target: "_blank" },
                React.createElement("img", { src: "/vite.svg", className: "logo", alt: "Vite logo" })),
            React.createElement("a", { href: "https://reactjs.org", target: "_blank" },
                React.createElement("img", { src: react_svg_1.default, className: "logo react", alt: "React logo" }))),
        React.createElement("h1", null, "Vite + React"),
        React.createElement("div", { className: "card" },
            React.createElement("button", { onClick: () => setCount((count) => count + 1) },
                "count is ",
                count),
            React.createElement("p", null,
                "Edit ",
                React.createElement("code", null, "src/App.tsx"),
                " and save to test HMR")),
        React.createElement("p", { className: "read-the-docs" }, "Click on the Vite and React logos to learn more")));
}
exports.default = App;
