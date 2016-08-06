var React = require("react");
var Emoji = require("./emoji");

var Row = React.createClass({

  _renderEmojis: function(){
    var select = this.props.select
    return this.props.emojiGroup.map(function(emoji){
      return <Emoji key={emoji.unicode} {...emoji} aria-label={emoji.name} 
                                   role="option" 
                                   onClick={function(){select(emoji);}}/>
    });
  },
  
  render: function() {    
    return <div className="emoji-row">{this._renderEmojis()}</div>;
  }
});

module.exports = Row;