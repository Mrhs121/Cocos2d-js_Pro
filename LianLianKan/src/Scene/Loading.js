//加载界面层
var LoadingLayer = cc.Layer.extend({
    ctor:function(params){
        this._super();
        this.init();
    },
    init:function(){
        var size = cc.winSize;
        //background
        var bg = cc.Sprite.create(res.Loading_bg);
        bg.attr({
            x:size.width/2,
            y:size.height/2,
            anchorX:0.5,
            anchorY:0.5
        });
        this.addChild(bg,0);

        //start button
        var startBtn = new cc.MenuItemImage(
            res.Start_btn,
            res.Start_btn,
            this.menuItemStartCallback,this
        );
        startBtn.x = size.width/2;
        startBtn.y = size.height/2;

        var menu = new cc.Menu(startBtn);
        menu.x = 0;
        menu.y = 0;
        this.addChild(menu,1);
    },
    menuItemStartCallback:function(sender){
        cc.log("Start Game");
        cc.director.runScene(new GameScene());
    }
});
//加载场景
var LoadingScene = cc.Scene.extend({
    onEnter:function(){
        this._super();
        var layer = new LoadingLayer();
        this.addChild(layer);

        cc.spriteFrameCache.addSpriteFrames(res.Fruit_plist,res.Fruit_png);
        cc.spriteFrameCache.addSpriteFrames(res.Light_plist,res.Light_png);

        //把要使用的动画添加到动画缓存中，以便下次使用
        //fruit 1-8各有两张图fruit7_2 fruit7_1
        for(var i = 1;i<=8;++i){
            var animation = new cc.Animation();
            animation.addSpriteFrame(cc.spriteFrameCache.getSpriteFrame("fruit"+i.toString()+"_2.png"));
            animation.addSpriteFrame(cc.spriteFrameCache.getSpriteFrame("fruit"+i.toString()+"_1.png"));
            animation.setDelayPerUnit(0.25);
            cc.animationCache.addAnimation(animation,"fruit_action_"+ i.toString());
        }
        //light 0、 1-8 light_0.png
        var animation = new cc.Animation();
        for(var i = 1;i<=8;++i){
            animation.addSpriteFrame(cc.spriteFrameCache.getSpriteFrame("light_"+i.toString()+".png"));
            animation.setDelayPerUnit(0.1);
        }
        cc.animationCache.addAnimation(animation,"light");
    },
});