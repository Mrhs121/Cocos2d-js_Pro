var scale_ = 1;                 //缩放因子
var canTouch = true;            //是否能够触摸
var m_row = 0;                  //游戏矩阵的行
var m_col = 0;                  //游戏矩阵的列
var m_line = new Array();       //连线
/*GameLayer类
*
* 方法:
*   ctor()
*   init()
*   randomsort()
*   addTouchEvent()
*   initSprite()
*   sortSprite()
*   timeSchedule()
* */
var GameLayer = cc.Layer.extend({
    m_spritesType:8,            //精灵类型:8
    m_sprites:null,             //精灵们
    m_activeSprites:null,       //激活的精灵们
    m_row:8,                    //游戏矩阵行:8行
    m_col:7,                    //游戏矩阵列:7行
    m_playLayer:null,           //游戏层
    m_spriteLayer:null,         //精灵层
    m_drawLayer:null,           //划线层
    m_playBatchNode:null,       //批量渲染节点
    m_timeTotal:240,            //游戏总时间
    m_timeCount:240,            //游戏时间计数
    m_timeGo:true,              //是否正在倒计时
    timer:null,                 //时间进度条
    //constrctor构造函数
    ctor:function(params){
        this._super();
        //初始化成员变量
        this.m_sprites = new Array();
        this.m_activeSprites = new Array();
        m_row = this.m_row;
        m_col = this.m_col;
        canTouch = true;
        //当前游戏界面放置的精灵数
        this.m_ItemCount = this.m_row*this.m_col;
        this.init();
        return true;
    },
    init:function(){
        //添加游戏背景
        var bg = cc.Sprite.create(res.Game_bg);
        //通过属性设置背景的锚点以及位置
        bg.attr({
            x:cc.winSize.width/2,
            y:cc.winSize.height/2,
            anchorX:0.5,
            anchorY:0.5
        });
        this.addChild(bg);

        //add big cloud添加大云朵
        var bigCloud = cc.Sprite.create(res.Big_cloud);
        bigCloud.attr({
            x:cc.winSize.width,
            y:cc.winSize.height-bigCloud.getContentSize().height/2
        });
        this.addChild(bigCloud,1);
        //大云朵左右移动动作
        var move_1 = new cc.MoveBy(this.m_timeCount/2,cc.p(-cc.winSize.width,0));
        var action_1 = new cc.Sequence(move_1,move_1.reverse());
        bigCloud.runAction(action_1.repeatForever());

        //add small cloud
        /*var smallCloud = cc.Sprite.create(res.Small_cloud);
        smallCloud.attr({

        });*/
        //添加移动的船只
        var ship_sp = cc.Sprite.create(res.MoveSp);
        ship_sp.attr({
            x:0,
            y:cc.winSize.height/8,
            anchorX:0,
            anchorY:0
        });
        this.addChild(ship_sp,1);
 /*创贝塞尔曲线动作需要一个ccBezierConfig对象：
    bezier.controlPoint_1：波谷偏向值；
    bezier.controlPoint_2：波峰偏向值；
    bezier.endPosition：动作终点。
曲线凹下去和凸起来的部分，对应是波谷和波峰，ccBezierConfig中的两个属性是用来设置波谷和波峰的偏向值的，而第三个属性是用来设置动作结束时精灵所在的位置。
而BezierBy是以精灵当前位置为基准的。所以坐标0不一定就是在0的位置。*/
        var _config_1 = cc.p(-cc.winSize.width/4,-cc.winSize.height/4);
        var _config_2 = cc.p(cc.winSize.width/4*3,cc.winSize.height/4);
        var _end = cc.p(cc.winSize.width,0);
        var bezier = [_config_1,_config_2,_end];
        var bezierBy = new cc.BezierBy(this.m_timeTotal/3,bezier);
        var action_3 = new cc.Sequence(bezierBy,bezierBy.reverse());
        ship_sp.runAction(action_3.repeatForever());

        //游戏层
        this.m_playLayer = new cc.Layer();
        this.m_playLayer.setContentSize(cc.winSize);
        this.m_playLayer.ignoreAnchorPointForPosition(false);
        this.m_playLayer.attr({
            x:cc.winSize.width/2,
            y:cc.winSize.height/2
        });
        this.addChild(this.m_playLayer,2);
        //画线层
        this.m_drawLayer = new cc.DrawNode();
        this.m_playLayer.addChild(this.m_drawLayer,2);//画线层与游戏层同一zorder 渲染次序相同
        //添加精灵层
        this.m_spriteLayer = new cc.Layer();
        this.m_playLayer.addChild(this.m_spriteLayer,5);

        //lodingBar
        //初始进度为100
        this.timer = new GameTimer(100);
        this.timer.attr({
            x:cc.winSize.width/2,
            y:cc.winSize.height-this.timer.getContentSize().height/2
        });
        this.addChild(this.timer,100);

        //刷新按钮 实现重新随机排序
        var refresh_btn = new ccui.Button();
        refresh_btn.setTouchEnabled(true);
        refresh_btn.loadTextures(res.Refresh_1,res.Refresh_2,"");

        var self = this;
        //点击刷新函数  实则调用了精灵排序方法
        function clickedRefresh(sender){
            self.sortSprite(sender);
        }
        //添加点击时间监听
        refresh_btn.addClickEventListener(clickedRefresh);
        this.addChild(refresh_btn,10);
        refresh_btn.attr({
            x:cc.winSize.width/2,
            y:60
        });
        //添加触摸事件
        this.addTouchEvent();
        //初始化精灵矩阵排列
        this.initSprite();
        //自定义定时器 每隔1s调用一次timeSchdule
        this.schedule(this.timeSchedule,1);
    },
    randomsort:function(a,b){
        return Math.random()>0.5?-1:1;
    },
    //核心游戏逻辑代码
    addTouchEvent:function(){
        var self = this;
        /*是否是直线连线
        * 1)这条连线开始结束点在同一行
        * 2)这条连线开始结束点在同一列
        * */
        function isDirectLink(_begain,_end){
            if(_begain.row == _end.row && _begain.col == _end.col){
                m_line.length = 0;
                return false;
            }
            //如果在同一行
            if(_begain.row == _end.row){
                var steps = _begain.col - _end.col;
                var direction = steps/Math.abs(steps);//1 or -1
                var row = _begain.row;
                for(var i = 1;i < Math.abs(steps);++i){
                    var col = _begain.col - i*direction;//所在列
                    var sprite = self.m_sprites[row*m_col+col];//计算出他的位置
                    //如果中间有水果则不能连线
                    if(sprite!=null){
                        m_line.length = 0;
                        return false;
                    }
                }
                m_line.push(new M_Segment(_begain,_end));
                return true;
            }
            //如果在同一列
            if(_begain.col == _end.col){
                var steps = _begain.row - _end.row;
                var direction = steps/Math.abs(steps);
                var col = _begain.col;
                for(var i = 1;i<Math.abs(steps);++i){
                    var row = _begain.row - i*direction;
                    var sprite = self.m_sprite[row*m_col+col];
                    if(sprite!=null){
                       // m_line.length = 0;
                        return false;
                    }
                }
                m_line.push(new M_Segment(_begain,_end));
                return true;
            }//
            return false;
        }
        /*是否是一个折角连线(由三个点即两线构成)
        * 1.拐点所在行与开始点所在行相同
        * 2.拐点所在行与结束点所在行相同
        * */
        function isOneCornerLink(_begain,_end){
            //如果是直线连接直接返回false
            if(_begain.row == _end.row && _begain.col == _end.col){
                m_line.length = 0;
                return false;
            }
            //中间点(拐点)所在行与开始点所在行一致
            var point_1 = new M_Point(_begain.row,_end.col);
            //直角连线一
            var islink_1 = (isDirectLink(_begain,point_1)&&isDirectLink(point_1,_end));
            if(islink_1){
                //中间点的位置没有精灵时才能连线
                if(self.m_sprites[point_1.row*m_col+point_1.col]==null){
                    return true;
                }
            }
            m_line.length = 0;
            //直角连线2
            //中间点(拐点)所在行与结束点所在行一致
            var point_2 = new M_Point(_end.row,_begain.col);
            var islink_2 = (isDirectLink(_begain,point_2)&&isDirectLink(point_2,_end));
            if(islink_2){
                if(self.m_sprites[point_2.row*m_col+point_2.col]==null){
                    return true;
                }
            }
            m_line.length = 0;
            return false;
        }
        /*两个折角点的连线(实际是一个OneCornerLink有折点的两条线加一条DirectLink) 四个点 及三条线*/
        function isTwoCornerLink(_begain,_end){
            //把四条线存入数组中
            function setSegment(point_1,point_2,point_3,point_4){
                m_line.length = 0;
                m_line.push(new M_Segment(point_1,point_2));
                m_line.push(new M_Segment(point_2,point_3));
                m_line.push(new M_Segment(point_3,point_4));
            }
            //如果结束位置和开始位置为同一位置(点)返回false
            if(_begain.row == _end.row && _begain.col == _end.col){
                m_line.length = 0;
                return false;
            }
            //3.1当开始点与结束点都在第一行或者最后一行时
            if(_begain.row == _end.row&&(_begain.row==0||_begain.row==m_row-1)){
                //如果都在最后一行 则中间点就在最大行的下一行 而第0行必定没有放置精灵
                var addline = -1;
                //如果都在第一行，则中间点就在第一行的上一行即第0行，这一行也必定没有放置精灵
                if(_begain.row==0){
                    addline = 1;
                }
                var p_1 = new M_Point(_begain.row-addline,_begain.col);
                var p_2 = new M_Point(_begain.row-addline,_end.col);
                setSegment(_begain,p_1,p_2,_end);
                return true;
            }
            m_line.length = 0;
            //3.2当起点与终点在第一列或者最后一列时
            if(_begain.col == _end.col &&(_begain.col==0||_begain.col==m_col-1)){
                var addline = -1;//最后一列时中间点的列必定是最大列+1
                if(_begain.col == 0){//第一列时中间点所在的列必定是第一列-1.
                    addline = 1;
                }
                var p_1 = new M_Point(_begain.row,_end.col-addline);
                var p_2 = new M_Point(_end.row,_end.col-addline);
                setSegment(_begain,p_1,p_2,_end);
                return true;
            }
            m_line.length = 0;
            //向下
            for(var _row = _begain.row+1;_row<=m_row;++_row){
               //当遍历到最后一行时
                if(_row == m_row){
                    //如果开始点的行为最后一行时
                    if(_row - 1 == _begain.row){
                       if(self.m_sprites[(_row-1)*m_col+_end.col]==null) {
                           var link = isDirectLink(_end,new M_Point((_row-1),_end.col));
                           if(link){
                               m_line.length = 0;
                               var p_1 = new M_Point(_row,_begain.col);
                               var p_2 = new M_Point(_row,_end.col);
                               setSegment(_begain,p_1,p_2,_end);
                               return true;
                           }
                       }
                    }

                    m_line.length = 0;
                    if(_row - 1 == _end.row){
                        if(self.m_sprites[(_row-1)*m_col+_begain.col]==null){
                            var link = isDirectLink(_begain,new M_Point((_row-1),_begain.col));
                            if(link){
                                m_line.length = 0;
                                var p_1 = new M_Point(_row,_begain.col);
                                var p_2 = new M_Point(_row,_end.col);
                                setSegment(_begain,p_1,p_2,_end);
                                return true;
                            }
                        }
                    }
                    m_line.length = 0;
                    if(self.m_sprites[(_row-1)*m_col+_begain.col]!=null || self.m_sprites[(_row-1)*m_col+_end.col]!=null){
                        break;
                    }
                    var link_1 = isDirectLink(_begain,new M_Point(_row-1,_begain.col));
                    var link_2 = isDirectLink(_end,new M_Point(_row-1,_end.col));
                    if(link_1 && link_2){
                        m_line.length = 0;
                        var p_1 = new M_Point(_row,_begain.col);
                        var p_2 = new M_Point(_row,_end.col);
                        setSegment(_begain,p_1,p_2,_end);
                        return true;
                    }
                }else{
                    m_line.length = 0;

                    var point_1 = new M_Point(_row,_begain.col);
                    //cc.log(point_1.row+""+point_1.col);
                    //如果中间点1位于开始点的下面[级同列] 如果这个点上有精灵则退出当前循环
                    if(self.m_sprites[point_1.row*m_col+point_1.col]!=null){
                        break;
                    }
                    //如果开始点与中间点1中间没有摆放精灵则可以连成一条直线[directlink] 而中间点与结束点可以连成一个拐点的线
                    var link_1 = isOneCornerLink(point_1,_end);
                    var link_2 = isDirectLink(_begain,point_1);
                    if(link_1&&link_2){
                        return true;
                    }
                }
            }

            //向上
            m_line.length = 0;

            for(var _row = _begain.row-1;_row>=-1;--_row){
                if(_row == -1){
                    //.1开始点所在行为第一行
                    if(0==_begain.row){
                        if(self.m_sprites[_end.col]==null){
                            var link = isDirectLink(_end,new M_Point(0,_end.col));
                            if(link){
                                m_line.length = 0;
                                var p_1 = new M_Point(_row,_begain.col);
                                var p_2 = new M_Point(_row,_end.col);
                                setSegment(_begain,p_1,p_2,_end);
                                return true;

                            }
                        }
                    }
                    m_line.length = 0;
                    //.2结束点所在行为第一行
                    if(0==_end.row){
                        if(self.m_sprites[_begain.col]==null){
                            var link = isDirectLink(_begain,new M_Point(0,_begain.col));
                            if(link){
                                m_line.length = 0;
                                var p_1 = new M_Point(_row,_begain.col);
                                var p_2 = new M_Point(_row,_end.col);
                                setSegment(_begain,p_1,p_2,_end);
                                return true;
                            }
                        }
                    }
                    m_line.length = 0;
                    if(self.m_sprites[_begain.col]!=null || self.m_sprites[_end.col]!=null){
                        break;
                    }
                    //如果开始点和结束点所在列上方都无精灵 判断两次直线连接即可
                    var link_1 = isDirectLink(_begain,new M_Point(0,_begain.col));
                    var link_2 = isDirectLink(_end,new M_Point(0,_end.col));
                    if(link_1&&link_2){
                        m_line.length = 0;
                        var p_1 = new M_Point(_row,_begain.col);//_row=-1
                        var p_2 = new M_Point(_row,_end.col);//_row2=-1
                        setSegment(_begain,p_1,p_2,_end);
                        return true;
                    }
                }
                else{//排除上面的特殊情况其他的只要判断一次一个拐角连接+一次直线连接
                    m_line.length = 0;
                    var point_1 = new M_Point(_row,_begain.col);
                    if(self.m_sprites[point_1.row*m_col+point_1.col] != null){
                        break;
                    }
                    var link_1 = isOneCornerLink(point_1,_end);
                    var link_2 = isDirectLink(_begain,point_1);
                    if(link_1 && link_2){
                        return true;
                    }
                }
            }

            //向左
            m_line.length = 0;
            cc.log("left");
            //从开始点向左边遍历
            for(var _col = _begain.col-1;_col>=-1;--_col){
                if(_col == -1){
                    //当开始点所在列为第一列时 只要检查结束点到中间点2是否是直线连接
                    if(0==_begain.col){
                        if(self.m_sprites[_end.row*m_col]==null){
                            var link = isDirectLink(_end,new M_Point(_end.row,0));
                            if(link){
                                m_line.length = 0;
                                var p_1 = new M_Point(_begain.row,_col);
                                var p_2 = new M_Point(_end.row,_col);

                                setSegment(_begain,p_1,p_2,_end);
                                return true;
                            }
                        }
                    }
                    m_line.length = 0;
                    //当结束点所在列为第一列时,只用检查开始点与中间点是否是直线连接
                    if(0==_end.col){
                        if(self.m_sprites[_begain.row*m_col] == null){
                            var link = isDirectLink(_begain,new M_Point(_begain.row,0));
                            if(link){
                                m_line.length = 0;
                                var p_1 = new M_Point(_begain.row,_col);
                                var p_2 = new M_Point(_end.row,_col);
                                setSegment(_begain,p_1,p_2,end);
                                return true;
                            }
                        }
                    }
                    m_line.length = 0;
                    if(self.m_sprites[_begain.row*m_col]!=null || self.m_sprites[_end.row*m_col]!=null){
                        break;
                    }
                    var link_1 = isDirectLink(_begain,new M_Point(_begain.row,0));
                    var link_2 = isDirectLink(_end,new M_Point(_end.row,0));
                    if(link_1 && link_2){
                        m_line.length = 0;
                        var p_1 = new M_Point(_begain.row,_col);
                        var p_2 = new M_Point(_end.row,_col);
                        setSegment(_begain,p_1,p_2,end);
                        return true;
                    }
                }
                else{
                    m_line.length = 0;
                    var point_1 = new M_Point(_begain.row,_col);
                    if(self.m_sprites[point_1.row*m_col+point_1.col]!=null){
                        break;
                    }
                    var link_1 = isOneCornerLink(point_1,_end);
                    var link_2 = isDirectLink(_begain,point_1);
                    if(link_1 && link_2){
                        return true;
                    }
                }
            }

            //向右
            m_line.length = 0;
            cc.log("right");
            for(var _col = _begain.col+1;_col<=m_col;++_col){
                if(_col == m_col){
                    if(m_col-1==_begain.col){
                        if(self.m_sprites[_end.row*m_col+_col-1]==null){
                            var link = isDirectLink(_end,new M_Point(_end.row,_col-1));
                            if(link){
                                m_line.length = 0;
                                var p_1 = new M_Point(_begain.row,_col);
                                var p_2 = new M_Point(_end.row,_col);
                                setSegment(_begain,p_1,p_2,_end);
                                return true;
                            }
                        }
                    }
                    m_line.length = 0;
                    if(m_col-1 == _end.col){
                        if(self.m_sprites[_begain.row*m_col+_col-1]==null){
                            var link = isDirectLink(_begain,new M_Point(_begain.row,_col-1));
                            if(link){
                                m_line.length = 0;
                                var p_1 = new M_Point(_begain.row,_col);
                                var p_2 = new M_Point(_end.row,_col);
                                setSegment(_begain,p_1,p_2,_end);
                                return true;
                            }
                        }
                    }
                    m_line.length = 0;
                    if(self.m_sprites[_begain.row*m_col+_col-1]!=null||self.m_sprites[_end.row*m_col+_col-1]!=null){
                        break;
                    }
                    var link_1 = isDirectLink(_begain,new M_Point(_begain.row,_col-1));
                    var link_2 = isDirectLink(_end,new M_Point(_end.row,_col-1));
                    if(link_1&&link_2){
                        m_line.length = 0;
                        var p_1 = new M_Point(_begain.row,_col);
                        var p_2 = new M_Point(_end.row,_col);
                        setSegment(_begain,p_1,p_2,_end);
                        return true;

                    }
                }else{
                    m_line.length = 0;
                    var point_1 = new M_Point(_begain.row,_col);
                    if(self.m_sprites[point_1.row*m_col+point_1.col]!=null){
                        break;
                    }
                    var link_1 = isOneCornerLink(point_1,_end);
                    var link_2 = isDirectLink(_begain,point_1);
                    if(link_1 && link_2){
                        return true;
                    }
                }
            }

            m_line.length = 0;
            return false;
        }
        //检查是否满足情况（上述三种连线情况之一）
        function checkLink(_begain,_end){
            var islink = isDirectLink(_begain,_end);
            if(islink){
                return islink;
            }

            islink = isOneCornerLink(_begain,_end);
            if(islink){
                return islink;
            }
            islink = isTwoCornerLink(_begain,_end);
            if(islink){
                return islink;
            }
            return false;
        }
        //点击水果
        function clickedItem(row,col){
            cc.log(row);
            cc.log(col);
            var sprite = self.m_sprites[row*self.m_col+col];
            if(sprite == null){
                return;
            }
            if(self.m_activeSprites.length==1){
                cc.log("check sprites");
                if(sprite.getActive() == false){
                    if(self.m_activeSprites[0].getType()==sprite.getType()){
                        cc.log("check again");
                        var _begain = self.m_activeSprites[0].getRowandCol();
                        var _end = sprite.getRowandCol();
                        var canRemove = checkLink(_begain,_end);
                        cc.log("canRemove");
                        if(canRemove){
                            canTouch = false;
                            sprite.setActive(true);
                            //drawLine画线
                            for(var i = 0;i<m_line.length;++i){
                                var point_1 = cc.p((m_line[i].p1.col+1)*100,(m_line[i].p1.row+1)*100);
                                var point_2 = cc.p((m_line[i].p2.col+1)*100,(m_line[i].p2.row+1)*100);
                                self.m_drawLayer.drawSegment(point_1,point_2,3,cc.color(255,0,0,255));
                            }
                            var action = new cc.CallFunc(function(){
                                var row_1 = sprite.getRowandCol().row;
                                var col_1 = sprite.getRowandCol().col;
                                var row_2 = self.m_activeSprites[0].getRowandCol().row;
                                var col_2 = self.m_activeSprites[0].getRowandCol().col;
                                self.m_sprites[row_1*self.m_col+col_1] = null;
                                self.m_sprites[row_2*self.m_col+col_2] = null;
                                //not blink

                                self.m_activeSprites[0].animation_sp.removeFromParent(true);
                                self.m_activeSprites[0].removeFromParent(true);
                                sprite.animation_sp.removeFromParent(true);
                                //移除精灵
                                sprite.removeFromParent(true);
                                self.m_drawLayer.clear();
                                m_line.length = 0;
                                self.m_activeSprites.length = 0;
                                self.m_ItemCount -= 2;
                                if(self.m_ItemCount == 0){
                                    cc.log("win");
                                }
                                canTouch = true;
                            });
                            self.m_drawLayer.runAction(new cc.Sequence(new cc.Blink(0.6,2),new cc.DelayTime(0.1),action));
                        }else{
                            m_line.length = 0;
                            cc.log("can't remove");
                        }
                    }else{
                        self.m_activeSprites[0].setActive(false);
                        self.m_activeSprites.length = 0;
                        cc.log("----------sub-------");
                    }
                }else{
                    sprite.setActive(false);
                    self.m_activeSprites.length = 0;
                }
            }else{
                self.m_drawLayer.clear();
                if(!sprite.getActive()){
                    sprite.setActive(true);
                    self.m_activeSprites.push(sprite);
                }
            }
        }
        //创建事件监听
        var listener = cc.EventListener.create({
            //单点触摸事件
            event:cc.EventListener.TOUCH_ONE_BY_ONE,
            //不向下吞噬
            swallowTouches:false
        });

        listener.onTouchBegan = function(touch,event){
            if(canTouch){
                return true;
            }
            return false;
        };
        listener.onTouchEnded = function(touch,event){
            var touch_point = touch.getLocation();
            var point = event.getCurrentTarget().convertToWorldSpace(cc.p(100,100));
            var x = touch_point.x-point.x+100*scale_*0.5;
            var y = touch_point.y-point.y+100*scale_*0.5;
            cc.log("x:"+x);
            cc.log("y:"+y);
            var col = Math.ceil(x/(100*scale_))-1;
            var row = Math.ceil(y/(100*scale_))-1;
            cc.log("row:"+row);
            cc.log("col:"+col);
            if(row>=0&&row<=m_row&&col>=0&&col<m_col){
                clickedItem(row,col);
                cc.log("touch ended");
            }
        };
        cc.eventManager.addListener(listener,this.m_playLayer);
    },
    initSprite:function(){
        function seeTheArray(_array){
            if(this.m_sprites === _array){
                cc.log("===");
            }
            var _text = "";
            for(var i = 0;i<_array.length;++i){
                _text = _text+_array[i].getType().toString();
            }
            cc.log(_text);
        }
        //随机产生1/2的水果阵
        for(var i = 0;i<this.m_row*this.m_col/2;++i){
            var item_type = Math.floor(Math.random()*this.m_spritesType+1);
            this.m_sprites[i] = new SpriteItem(item_type);
        }
        //拷贝先前产生的1/2的水果阵
        for(var i = 0;i<this.m_row*this.m_col/2;++i){
            var _type = this.m_sprites[i].getType();
            this.m_sprites.push(new SpriteItem(_type));
        }
        //参数:大于0升序 小于0降序
        this.m_sprites.sort(this.randomsort);

        //显示精灵放置背景
        var sp_bg = new cc.Sprite(res.Game_spbg);
        sp_bg.setPosition(cc.p(m_col*100/2+50,m_row*100/2+50));
        sp_bg.setScaleX(m_col/8);
        sp_bg.setScaleY(m_row/8);
        this.m_playLayer.addChild(sp_bg,0);

        var isFirstAdd = true;
        for(var row = 0;row<this.m_row;++row){
            for(var col = 0;col<this.m_col;++col){
                var point = cc.p((col+1)*100,(row+1)*100);
                if(isFirstAdd){
/*渲染批次：这是游戏引擎中一个比较重要的优化指标，指的是一次渲染凋用。也就是说，渲染的次数越少，游戏的运行效率越高。
  *SpriteBatchNode就是cocos2d-x为了降低渲染批次而建立的一个专门管理精灵的类*/
                    //参数1：图片资源路径,参数2：容量
                    this.m_playBatchNode = new cc.SpriteBatchNode(res.Fruit_png,m_row*m_col);
                    this.m_playLayer.addChild(this.m_playBatchNode,1);
                    isFirstAdd = false;
                }
                var sp = new cc.Sprite(this.m_playBatchNode.getTexture(),cc.rect(56,2,90,90));
                sp.setPosition(point);
                this.m_playBatchNode.addChild(sp);

                var sprite = this.m_sprites[row*this.m_col+col];
                sprite.setRowandCol(row,col);
                sprite.setPosition(point);
                this.m_spriteLayer.addChild(sprite,5);
            }
        }
        //游戏层宽高设置
        var playLayerWidth = (this.m_col+1)*100;
        var playLayerHeight = (this.m_row+1)*100;
        this.m_playLayer.setContentSize(playLayerWidth,playLayerHeight);
        //如果游戏层的宽大于屏幕宽 则按比例缩小
        if(playLayerWidth>cc.winSize.width){
            var scale_temp = (cc.winSize.width-20)/playLayerWidth;
            scale_ = scale_temp;
            this.m_playLayer.setScale(scale_temp);
        }
        //设置游戏层位置为屏幕中心
        this.m_playLayer.setPosition(cc.p(cc.winSize.width/2,cc.winSize.height/2));

    },
    sortSprite:function(param){
        if(!canTouch)
            return;
        var self = this;
        var action_1 = new cc.CallFunc(function(){
            canTouch = false;
            param.setEnabled(false);
        });
        var action_2_1 = new cc.RotateBy(1,540);
        var action_2_2 = new cc.ScaleBy(1,0.1);
        //同时旋转并缩放
        var action_2 = new cc.Spawn(action_2_1,action_2_2);
        var action_3 = new cc.CallFunc(function(){
            //排序
            self.m_sprites.sort(self.randomsort);
            //重新放置
            for(var row = 0;row<m_row;++row){
                for(var col=0;col<m_col;++col){
                    if(self.m_sprites[row*m_col+col]!=null){
                        self.m_sprites[row*m_col+col].setRowandCol(row,col);
                        var point = cc.p((col+1)*100,(row+1)*100);
                        self.m_sprites[row*m_col+col].runAction(new cc.MoveTo(0.8,point));
                    }
                }
            }
            cc.log("is sortOk");

        });
        var action_4 = new cc.Spawn(action_2_1.reverse(),action_2_2.reverse());
        var action_5 = new cc.CallFunc(function(){
            canTouch = true;
            param.setEnabled(true);
        });
        var action = new cc.Sequence(action_1,action_3,new cc.DelayTime(1),action_5);
        self.m_spriteLayer.runAction(action);
    },
    timeSchedule:function(dt){
        if(this.m_timeGo)
            this.m_timeCount = this.m_timeCount-1;
        if(this.m_timeCount<=0){//当时间计数小于0
            this.unschedule(this.timeSchedule);
            canTouch = false;
            cc.log("Game Over");
        }
        //通过时间比得到进度条的百分比
        var percent = Math.floor((this.m_timeCount/this.m_timeTotal)*100);
        this.timer.setPercent(percent);
    }
});

var GameScene = cc.Scene.extend({
    onEnter:function(){
        this._super();
        var layer = new GameLayer();
        this.addChild(layer);
    }
});