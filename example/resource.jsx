import React from 'react';
import {GET} from 'wegweiser';

import Consumer from './public/consumer';

export default class Routes {
  @GET('/routed')
  getRouted() {
    return 'ok';
  }

  @GET('/hello/:name')
  getReact(req, params) {
    return <Consumer name={params.name} />;
  }
}
