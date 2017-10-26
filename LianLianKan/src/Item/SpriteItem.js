/*SpriteItem类:继承了Sprite
用于创建水果
*属性：item_type
*       isActive
*       animation_sp
*       row
*       col
*方法:ctor(_type)
*     getType()
*     setActive(_active)
*     getActive()
*     setRowandCol()
*     getRowandCol()
* */
/*点类
* 成员变量:
* row:
* col:
* */
//根据行列确定这个点的位置
function M_Point(_row,_col){
    this.row = _row;
    this.col = _col;
}
//线段类：两个点
function M_Segment(_p1,_p2){
    this.p1 = _p1;
    this.p2 = _p2;
}

var SpriteItem = cc.Sprite.extend({
    item_type : null,   //  水果类型
    isActive:false,     //是否被激活[被点击]
    animation_sp:null,  //精灵周围的光束动画
    row:null,           //itemSprite所在行
    col:null,           //itemSprite所在列

    //constructor
    ctor:function(_type){
        this._super();
        this.item_type = _type;
        var filename  = "fruit" + this.item_type.toString() + "_1.png";
        this.setSpriteFrame(filename);
        this.setAnchorPoint(cc.p(0.5,0.5));
    },
    getType:function(){
      return this.item_type;
    },
    setActive:function(_active){
        this.isActive = _active;
        if(this.isActive){
            //执行水果点击动画 眨眼   从动画缓存(在loadingScene已经添加动画(保存了多张精灵帧)完毕)中获取动画
            var animate = cc.animate(cc.animationCache.getAnimation("fruit_action_"+this.item_type.toString()));
            this.runAction(animate.repeatForever());
            //显示光束的第一张图
            this.animation_sp = new cc.Sprite("#light_0.png");
            var point = this.getPosition();
            this.animation_sp.setPosition(point);
            this.getParent().addChild(this.animation_sp,4);

           //add light_animate添加光束动画
           // var light_animate = cc.animate(cc.animationCache.getAnimation("light"));
            var light_animate = cc.animate(cc.animationCache.getAnimation("light"));
            this.animation_sp.runAction(light_animate.repeatForever());
        }else{//没有点击的话，那么就显示第一张静图
            this.stopAllActions();
            //显示水果的第一张图 相当于静态图
            var filename = "fruit"+this.item_type.toString()+"_1.png";
            this.setSpriteFrame(filename);
            //显示光束的第一张图
            this.animation_sp.stopAllActions();
            //var filename = "light_0.png";
            this.animation_sp.setSpriteFrame("light_0.png");

        }
    },
    getActive:function(){
        return this.isActive;
    },
    setRowandCol:function(_row,_col){
        this.row = _row;
        this.col = _col;
    },
    getRowandCol:function(){
        var p = new M_Point(this.row,this.col);
        return p;
    }

});
