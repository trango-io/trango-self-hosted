import React, { Component } from "react";
import { Route, HashRouter as Router } from "react-router-dom";
import Home from "./components/Dashboard/Index";
export default class Routes extends Component {
  render() {
    return (
      <Router>
        <div>
          <Route exact path="/" component={Home} />
        </div>
      </Router>
    );
  }
}
