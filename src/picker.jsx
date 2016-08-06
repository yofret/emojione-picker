var React = require("react");
var Emoji = require("./emoji");
var Modifiers = require("./modifiers");
var strategy = require("./strategy");
var Row = require("./row");
var LazyLoad = require("react-lazyload").default;
var emojione = require("emojione");
var store = require("store");
var _ = require("underscore");

var Picker = React.createClass({
    propTypes: {
      search: React.PropTypes.string,
      onChange: React.PropTypes.func.isRequired
    },

    getDefaultProps: function() {
      return {
        search: '',
        categories: {
          people: {
            title: 'People',
            emoji: 'smile'
          },
          nature: {
            title: 'Nature',
            emoji: 'hamster'
          },
          foods: {
            title: 'Food & Drink',
            emoji: 'pizza'
          },
          activity: {
            title: 'Activity',
            emoji: 'soccer'
          },
          travel: {
            title: 'Travel & Places',
            emoji: 'earth_americas'
          },
          objects: {
            title: 'Objects',
            emoji: 'bulb'
          },
          symbols: {
            title: 'Symbols',
            emoji: 'clock9'
          },
          flags: {
            title: 'Flags',
            emoji: 'flag_gb'
          }
        }
      }
    },

    getInitialState: function() {
      return {
        modifier: store.get('emoji-modifier') || 0,
        rendered: 0,
        category: false,
      };
    },

    componentWillMount: function() {
      this.setState({emojis: this.emojisFromStrategy(strategy)});
    },

    componentDidMount: function() {
      this.updateActiveCategory();
    },

    componentWillReceiveProps: function(nextProps) {
      if (this.props.search != nextProps.search) {
        this.setState({term: this.props.search});
      }
    },

    // componentDidUpdate: function(prevProps, prevState) {
    //   if (this.state.rendered < Object.keys(this.props.categories).length) {
    //     setTimeout(function(){
    //       if (this.isMounted()) {
    //         this.setState({rendered: this.state.rendered+1});
    //       }
    //     }.bind(this), 0);
    //   }
    // },


    updateActiveModifier: function(modifier) {
      this.setState({modifier: modifier});
      store.set('emoji-modifier', modifier);
    },

    emojisFromStrategy: function(strategy) {
      var emojis = {};

      // categorise and nest emoji
      // TODO: this could be done as a preprocess.
      for (var key in strategy) {
        var value = strategy[key];

        // skip unknown categories
        if (value.category !== 'modifier') {
          if (!emojis[value.category]) emojis[value.category] = {};
          var match = key.match(/(.*?)_tone(.*?)$/);

          // this does rely on the modifer emojis coming later in strategy
          if (match) {
            emojis[value.category][match[1]][match[2]] = value;
          } else {
            emojis[value.category][key] = [value];
          }
        }
      }

      return emojis;
    },

    updateActiveCategory:  _.throttle(function() {
      var scrollTop = this.refs.grandlist.scrollTop;
      var padding = 10;
      var selected = 'people';

      _.each(this.props.categories, function(details, category) {
        if (this.refs[category] && scrollTop >= this.refs[category].offsetTop-padding) {
          selected = category;
        }
      }.bind(this));

      if (this.state.category != selected) {
        this.setState({category: selected});
      }
    }, 100),

    jumpToCategory: function(name) {
      this.setState({category: name});
      var offsetTop = this.refs[name].offsetTop;
      var padding = 5;
      this.refs.grandlist.scrollTop = offsetTop-padding;
    },

    getCategories: function() {
      var headers = [];
      var jumpToCategory = this.jumpToCategory;

      _.each(this.props.categories, function(details, key){
        headers.push(<li key={key} className={this.state.category == key ? "active" : ""}>
          <Emoji role="menuitem" aria-label={key + " category"} shortname={":"+details.emoji+":"} onClick={function(){
            jumpToCategory(key);
          }}/>
        </li>);
      }.bind(this));
      return headers;
    },

    getEmojis: function() {
      var sections = [];
      var modifier = this.state.modifier;
      var term = this.state.term;
      var i = 0;

      // render emoji in category sized chunks to help prevent UI lockup
      _.each(this.props.categories, function(category, key) {
        var list = this.state.emojis[key];
        var rows = [];
        
        list = _.map(list, function(data){
          var modified = modifier && data[modifier] ? data[modifier] : data[0];
          return modified;
        });

        list = _.compact(list);

        while(list.length) {
          rows.push(
            <LazyLoad key={++i} height={26} once={true} offset={130} overflow={true}>     
              <Row emojiGroup={list.splice(0,8)} select={this.props.onChange} />
            </LazyLoad>
          );
        }

        sections.push(
          <div className="emoji-category" key={key} ref={key}>
            <h2 className="emoji-category-header">{category.title}</h2>
            <ul className="emoji-category-list">{rows}</ul>
          </div>
        );
      }.bind(this));

      return sections;
    },

    getModifiers: function() {
      // we hide the color tone modifiers when searching to reduce clutter
      if (!this.state.term) {
        return <Modifiers active={this.state.modifier} onChange={this.updateActiveModifier} />
      }
    },

    render: function() {
      var classes = 'emoji-dialog';
      if (this.props.search === true) classes += ' with-search';

      return <div className={classes} role="dialog">
        <header className="emoji-dialog-header" role="menu">
          <ul>{this.getCategories()}</ul>
        </header>
        <div className="emoji-grandlist" ref="grandlist" role="listbox">
          {this.getModifiers()}
          {this.getEmojis()}
        </div>
      </div>
    }
});

module.exports = Picker;
