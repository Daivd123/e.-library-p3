import React, {Component} from "react";
import {Rajdhani_600SemiBold} from "@expo-google-fonts/rajdhani";
import * as Font from "expo-font";

import bottomTabNavigator from "./components/BottomTabNavigator";

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      fontloaded: false
    };
  }

  async laodFOnts() {
    await Font.loadAsync({
      Rajdhani_600SemiBold: Rajdhani_600SemiBold
    });
    this.setState({fontloaded: true});
  }
}