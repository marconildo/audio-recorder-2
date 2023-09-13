import React from "react";
import ReactDOM from "react-dom";

import Example from "./Example";

const App = ({ children }) => <div style={{ margin: 20 }}>{children}</div>;

ReactDOM.render(
  <App>
    <Example />
  </App>,
  document.getElementById("root")
);
