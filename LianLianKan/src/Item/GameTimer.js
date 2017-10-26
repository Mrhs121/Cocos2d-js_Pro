/*
* GameTimer类：继承了cc.Sprite
* 属性：m_timer  滚动条
* 方法：ctor(_percent)  构造函数
        setPercent(_percent)  设置百分比
        getPercent()  获取百分比
* */
//滚动条背景
var GameTimer  = cc.Sprite.extend({
    m_timer:null,
    ctor:function(_percent){
      this._super();
      this.setSpriteFrame("timer_bg.png");
      this.setContentSize(cc.size(442,35));
      this.m_timer = new ccui.LoadingBar(res.Timer,100);
      this.m_timer.attr({
          x:221,
          y:20
      });
      //在滚动条背景上添加滚动条
      this.addChild(this.m_timer,1);
      if(typeof(_percent) == "undefined"){
        this.m_timer.setPercent(0);
      }
      else
        this.m_timer.setPercent(_percent);
    },
    //注意对传入_percent特殊范围值的处理
    setPercent:function(_percent){
      if(_percent>100)
        _percent = 100;
      if(_percent<0)
        _percent = 0;
      this.m_timer.setPercent(_percent);
    },
    getPercent:function(){
      return this.m_timer.getPercent();
    }
});