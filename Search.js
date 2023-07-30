import React, {Component} from "react";
import {View, Text, StyleSheet} from "react-native";

export default class SearchScreen extends Component {
  render() {
    return (
      <View style ={styles.container}>
        <Text style={styles.text}>Search Screen</Text>
      </View>
    );
  }
}

const styles = styleSheet.create({
  container : {
    flex: 1,
    jsutifyContent: "center",
    alignItems: "center",
    backgroundColor: "#54281"
  },
  text: {
    color: "#ffff",
    fontSize: 30
  }
});