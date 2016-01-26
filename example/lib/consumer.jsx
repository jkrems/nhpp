import React from 'react';
import Relay from 'react-relay';

import Layout from './layout';

var Consumer = React.createClass({
  render() {
    var ep = this.props.episode;
    return <Layout>
      <h1>Hello, {this.props.name || 'World'}!</h1>
      <blockquote>{ep.subtitle} ({ep.year})</blockquote>
    </Layout>;
  }
});

export default Relay.createContainer(Consumer, {
  fragments: {
    episode() {
      return Relay.QL`
        fragment on EpisodeInfo { year, subtitle }`;
    },
  },
});
