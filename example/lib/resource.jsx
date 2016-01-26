import IsomorphicRelay from 'isomorphic-relay';
import React from 'react';
import Relay from 'react-relay';
import {GET} from 'wegweiser';

import Consumer from './consumer';

export default class Routes {
  @GET('/routed')
  getRouted() {
    return 'ok';
  }

  @GET('/episodes/:num')
  getReact(req, params) {
    const rootContainerProps = {
      Component: Consumer,
      route: {
        name: '__unnamed',
        params: { num: params.num, name: 'Robin' },
        queries: {
          episode: () => Relay.QL`query { episode(num: $num) }`,
        },
      },
    };
    return IsomorphicRelay.prepareData(rootContainerProps)
      .then(data => {
        return <IsomorphicRelay.RootContainer {...rootContainerProps} />;
      });
  }
}
