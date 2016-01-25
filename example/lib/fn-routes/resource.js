import {GET} from 'wegweiser';

export default [
  GET('/stuff')(req => 'Stuff'),

  GET('/more/:type')((req, {type}) => `More ${type}`),
];
