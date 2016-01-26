import {
  GraphQLEnumType,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLSchema
} from 'graphql';

const episodeEnum = new GraphQLEnumType({
  name: 'Episode',
  description: 'One of the films in the Star Wars Trilogy',
  values: {
    NEWHOPE: {
      value: 4,
      description: 'Released in 1977.',
    },
    EMPIRE: {
      value: 5,
      description: 'Released in 1980.',
    },
    JEDI: {
      value: 6,
      description: 'Released in 1983.',
    },
  },
});

const episodeInfo = new GraphQLObjectType({
  name: 'EpisodeInfo',
  fields() {
    return {
      num: { type: episodeEnum },
      year: { type: GraphQLInt },
      subtitle: { type: GraphQLString },
    };
  },
});

const queryType = new GraphQLObjectType({
  name: 'Query',
  fields() {
    return {
      episode: {
        type: episodeInfo,
        args: {
          num: {
            description: 'Return episode by number in sequence',
            type: episodeEnum,
          },
        },
        resolve(root, args) {
          switch (args.num) {
            case 4: return { num: 4, year: 1977, subtitle: 'A New Hope' };
            case 5: return { num: 5, year: 1980, subtitle: 'The Empire Strikes Back' };
            case 6: return { num: 6, year: 1983, subtitle: 'Return Of The Jedi' };
            default: throw new Error('Invalid episode ' + args.num);
          }
        },
      },
    };
  },
});

export default new GraphQLSchema({ query: queryType });
