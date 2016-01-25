import React from 'react';

import Layout from './layout';

var Consumer = React.createClass({
  render() {
    return <Layout>
      <h1>Hello, {this.props.name || 'World'}!</h1>
      <blockquote>How are you on this wonderful day?</blockquote>
    </Layout>;
  }
});

export default Consumer;
