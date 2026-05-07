import {defineStore, storeToRefs} from "pinia";
import axios from "axios";
import {Layer, Tile} from "ol/layer";
import {OSM, TileWMS, XYZ} from "ol/source";
import {Map} from "ol";
import {unByKey} from "ol/Observable";
// 新增
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Stroke } from 'ol/style';

import OSMXML from 'ol/format/OSMXML';

const useMapStore =  defineStore('map',{
    state:()=>({
            currentYear:2023,
            currentMonth:1,
            map: new Map({}),
            yearInfo:[],
            monthInfo:[],
            featureInfo:[],
            cropInfo:[],
            imageryInfo:[],
            topoInfo:[], // 地形图信息
            yearPlayer: {},
            monthPlayer: {},
            isYearPlaying:false,
            isMonthPlaying:false,
            cropClassificationLayers:[],
            topoLayers:[{},{},{},{}], // 地形图各要素图层
            basinOverviewLayer:new Layer({}), // 流域总览底图
            mountainLayer:new Layer({}), // 山脉图层
            riverLayer:new Layer({}), // 河流图层
            lakeLayer:new Layer({}), // 湖泊图层
            farmlandLayer:new Layer({}), // 农田图层
            timeLayer: new Layer({}),
            landLayer:new Layer({}),
            colorLayer:new Layer({}),
            cropLayer:new Layer({}),
            basicLayer:new Layer({}),
            cropLandLayer:new Layer({}),
            cropLayerLine:new Layer({}),
            huanTaiLandLayer:new Layer({}),
            huanTaiColorLayer:new Layer({}),
            administrativeLayer:new Layer({}),
            cropImageryLayers:[{},{}],
            clickItem:0, // 当前选中的要素ID
            featureId:0,
            currentCrop:'',
            cropList:['other','cotton','corn','wheat','vegetable'], // 作物类型
            topoList:['mountain','river','lake','farmland'], // 地形图类型
            isShowFeautureInfo:false,
            clickChoose:{},
            baseUrl:process.env.VUE_APP_GEOSERVER_URL,
            cropWaterShowCylinder:true,
            cropWaterActiveMetric:'blueWater',
            cropWaterActiveDate:'2019-04-18',
            cropWaterActiveCrop:'cotton',
            cropWaterSummaryData:null,
    }),
    actions:{
        //网络请求接口
        loadingInfo(name){
            return axios.get(`/static/${name}.json`)
        },

        //获取作物信息
        getCropInfo:async function(){
            try {
                let res = await this.loadingInfo('crop')
                this.cropInfo=res.data
                // this.addCropLandLayer()
                // this.addCropImageryLayers()
                this.loadCrop(this.cropInfo)
            }catch(error){
                alert("无法获取作物数据")
            }
        },

        //获取要素信息
        getFeatureInfo:async function(){
            try {
                let res = await this.loadingInfo('featureInfo')
                this.featureInfo = res.data
                this.loadFeature(this.featureInfo)
            }catch(error){
                alert("无法获取地理要素数据")
            }
        },

        //获取图层类型信息
        getImageryInfo:async function(){
            try {
                let res = await this.loadingInfo('imageInfo')
                this.imageryInfo= res.data
                // this.addHuanTaiLand()
                // this.addHuanTaiColor(0)
            }catch(error){
                alert("无法获取地表图层数据")
            }
        },

        //获取地形图信息
        getTopoInfo:async function(){
            try {
                let res = await this.loadingInfo('topoInfo')
                this.topoInfo = res.data
                // this.loadTopo(this.topoInfo)
            }catch(error){
                alert("无法获取地形图数据")
            }
        },
        getYearInfo:async function(){
            try {
                let res = await this.loadingInfo('yearInfo')
                this.yearInfo = res.data
            }catch(error){
                alert("无法获取年份数据")
            }
        },

        //获取月份表
        getMonthInfo:async function(){
            try{
                let res = await this.loadingInfo('monthInfo')
                this.monthInfo = res.data
            }catch(error){
                alert("无法获取月份数据")
            }
        },

        //载入要素信息
        loadFeature:function(list){
            list.forEach((item)=>{
                // this.addFeatureLayer([])
            })
        },

        //载入颜色信息
        loadColor:function(color){
            let info={"fillColor": color,"opacity": "0.5", "strokeColor": "#000000", "strokeWidth": "0.1"}
            this.addColorLayer(info)
        },

        //载入作物信息
        loadCrop:function(crop){
            let cropOpacityInfo ={other:0,wheat:0,cotton:0,corn:0,fruit:0}
            crop.forEach((item)=>{
                if(item.index===0){
                    cropOpacityInfo.other=1
                }else if(item.index===1){
                    cropOpacityInfo.cotton=1
                }
                else if(item.index===2){
                    cropOpacityInfo.corn=1
                }else if(item.index===3){
                    cropOpacityInfo.wheat=1
                } else if(item.index===4){
                    cropOpacityInfo.fruit=1
                }
            })
            // alert([cropOpacityInfo.other,cropOpacityInfo.cotton,cropOpacityInfo.corn,cropOpacityInfo.wheat])
            this.addCropLayer(cropOpacityInfo)
        },

        //载入地形图信息
        loadTopo:function(topo){
            // 构建地形图要素的可见性对象
            let topoOpacityInfo = {mountain:0, river:0, lake:0, farmland:0}
            topo.forEach((item)=>{
                if(item.index===0){
                    topoOpacityInfo.mountain=1
                }else if(item.index===1){
                    topoOpacityInfo.river=1
                }else if(item.index===2){
                    topoOpacityInfo.lake=1
                }else if(item.index===3){
                    topoOpacityInfo.farmland=1
                }
            })
            this.addTopoLayer(topoOpacityInfo)
        },

        // 添加基础图层
        addBasicLayer:function(){
            const layer = new Tile({
                source:new XYZ({
                    // url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
                    // url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
                    url: "https://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
                    crossOrigin: "anonymous"
                })
            })
            this.clearMap(0)
            this.basicLayer = layer
            this.map.addLayer(this.basicLayer)
        },

        // 添加时间图层
        addTimeData:async function({year,month}){
            console.log(this.baseUrl)
            try{
                let res =  await axios({
                    headers:{
                        "Content-Type":"application/json; charset=utf-8",
                        "Accept": "application/json",
                        "Authorization": "Basic " + btoa("admin:geoserver")
                    },
                    url:`${this.baseUrl}/geoserver/rest/workspaces/test/coveragestores/changji_${year}${month}/coverages/changji_${year}${month}.json`,
                    method:'get',
                    data:{},
                })
                let info   = res.data.coverage.latLonBoundingBox
                const Source = new TileWMS({
                    url:`${this.baseUrl}/geoserver/test/wms`,
                    params: {
                        LAYERS: `test:changji_${year}${month}`,
                        VERSION: '1.1.1',
                        TILED: true,
                        STYLES:'resetChannel'
                    },
                    projection:info.crs,
                    serverType:'geoserver'
                })
                const timeLayer = new Tile({
                    source:Source
                })
                // this.clearMap(0)
                this.removeCropImageryLayers()
                this.removeCropLayer()
                this.removeCropLayerLine()
                this.removeTimeData()
                this.timeLayer = timeLayer
                // this.map.addLayer(this.timeLayer)
                this.addAdministrativeLayer()
                this.map.getLayers().insertAt(1,this.timeLayer)
            }catch(err){
                clearInterval(this.yearPlayer)
                clearInterval(this.monthPlayer)
                this.isYearPlaying=false,
                this.isMonthPlaying=false,
                alert(`无法获取对应${year}年${month}月的数据`)
            }
        },

        // 添加作物底图
        addCropLandLayer:function(){
            const cropLandSource = new TileWMS({
                url:`${this.baseUrl}/geoserver/test/wms`,
                params:{
                    // LAYERS:'test:huantai_landmass',
                    LAYERS:'test:changji_layer_0',
                    VERSION:'1.1.1',
                    TILED:true,
                    // STYLES:'resetChannel'
                },
                projection:'EPSG:4326',
                serverType:'geoserver'
            })
            const cropLandLayer = new Tile({
                source:cropLandSource,
            })
            // this.clearMap(0)
            this.cropLandLayer=cropLandLayer
            this.map.addLayer(this.cropLandLayer)
        },

        addCropImageryLayers:function(){
            if(!this.map || !this.map.addLayer) return
            let i=0;
            // console.log(this.cropImageryLayers)
            this.cropImageryLayers.forEach(layer=>{
                if(Object.keys(layer).length !== 0){
                    this.map.addLayer(layer)
                    i++;
                    // return layer;
                }else{
                    const cropLandSource = new TileWMS({
                        url:`${this.baseUrl}/geoserver/test/wms`,
                        params:{
                            // LAYERS:'test:huantai_landmass',
                            LAYERS:`test:changji_layer_${i}`,
                            VERSION:'1.1.1',
                            TILED:true,
                            // STYLES:'resetChannel'
                        },
                        projection:'EPSG:4326',
                        serverType:'geoserver'
                    })
                    const cropLandLayer = new Tile({
                        source:cropLandSource,
                    })
                    this.map.addLayer(cropLandLayer)
                    // return cropLandLayer;
                    this.cropImageryLayers[i]=cropLandLayer;
                    i++;
                }

            })
        },

        addCropLayerLine:function(){
            if(!this.map || !this.map.addLayer) return
            const Source = new TileWMS({
                url:`${this.baseUrl}/geoserver/test/wms`,
                params:{
                    LAYERS:'test:changji_parcel_shp',
                    VERSION: '1.1.1',
                    TILED: true,
                    STYLES:'crop_line',
                },
                projection:'EPSG:4326',
                serverType:'geoserver'
            })
            const cropLayerLine = new Tile({
                source:Source,
            })
            // this.clearMap(0)
            this.cropLayerLine = cropLayerLine
            this.map.addLayer(this.cropLayerLine)
        },

        removeCropLayerLine:function(){
            if(!this.map || !this.map.removeLayer) return
            this.map.removeLayer(this.cropLayerLine)
        },

        //添加作物图层
        addCropLayer:function({other,wheat,cotton,corn,fruit}){
            if(!this.map || !this.map.addLayer) return
            // this.map.removeLayer(this.cropLandLayer)
            const source = new TileWMS({
                url:`${this.baseUrl}/geoserver/test/wms`,
                params: {
                    // LAYERS:'test:huantai_croptype',
                    LAYERS:'test:changji_crop_shp',
                    VERSION: '1.1.1',
                    TILED: true,
                    STYLES:'crop_style',
                    env:`other:${other};wheat:${wheat};cotton:${cotton};corn:${corn};fruit:${fruit}`,
                    // env:`other:${other};wheat:${wheat};fallow:${fallow};oilseed:${oilseed};orange:${orange}`;
                },
                projection:'EPSG:4326',
                serverType:'geoserver'
            })
            const cropLayer = new Tile({
                source:source
            })
            let viewResolution = this.map.getView().getResolution();
            let store = useMapStore()
            let{currentCrop,featureId,cropList,isShowFeautureInfo} = storeToRefs(store)
            if(Object.getOwnPropertyNames(this.clickChoose).length!==0){
                unByKey(this.clickChoose)
            }
            //每次加载图层前一定要重新添加点选，否则会出现按钮叠加，会报错
            this.clickChoose = this.map.on('singleclick', function(evt) {
                let url = source.getFeatureInfoUrl(
                    evt.coordinate, viewResolution, 'EPSG:4326',
                    {
                        'INFO_FORMAT': 'application/json'
                    }); // 这里可以根据需要调整返回信息的格式

                if (url) {
                    fetch(url)
                        .then(function (response) {
                            return response.json();
                        })
                        .then(function (json) {
                            // 这里处理返回的信息，例如弹窗显示
                            // console.log(json.features[0].properties)
                            currentCrop.value = cropList.value[json.features[0].properties['Max_gridco']]
                            featureId.value = json.features[0].properties['FID_1']
                            // console.log(currentCrop.value,featureId.value)
                            if(!isShowFeautureInfo.value){
                                isShowFeautureInfo.value = !isShowFeautureInfo.value
                            }
                        });
                }
            });
            this.removeTimeData()
            this.removeCropLayer()
            // this.clearMap(2)
            this.cropLayer = cropLayer
            this.map.addLayer(this.cropLayer)
        },

        addAdministrativeLayer:function(){
            if(!this.map || !this.map.addLayer) return
            const source = new TileWMS({
                url:`${this.baseUrl}/geoserver/test/wms`,
                params: {
                    // LAYERS:'test:huantai_croptype',
                    LAYERS:'test:changji_administrative_shp',
                    VERSION: '1.1.1',
                    TILED: true,
                    STYLES:'changji_administrative',
                    // env:`other:${other};wheat:${wheat};cotton:${cotton};corn:${corn};fruit:${fruit}`,
                    // env:`other:${other};wheat:${wheat};fallow:${fallow};oilseed:${oilseed};orange:${orange}`;
                },
                projection:'EPSG:4326',
                serverType:'geoserver'
            })
            const administratorLayer = new Tile({
                source:source
            })
            this.administrativeLayer = administratorLayer
            this.map.addLayer(this.administrativeLayer)
        },

        removeCropLayer:function(){
            if(!this.map || !this.map.removeLayer) return
            this.map.removeLayer(this.cropLayer)
        },
        removeAdministrativeLayer:function(){
            if(!this.map || !this.map.removeLayer) return
            this.map.removeLayer(this.administrativeLayer)
        },
        removeCropImageryLayers:function(){
            if(!this.map || !this.map.removeLayer) return
            this.cropImageryLayers.forEach(layer=>{
                console.log(layer)
                if(Object.keys(layer).length !== 0){
                    console.log(true)
                    this.map.removeLayer(layer);
                }
            })
        },
        removeClick:function (){
            if(!this.clickChoose || Object.getOwnPropertyNames(this.clickChoose).length===0) return
            unByKey(this.clickChoose)
        },
        removeTimeData:function(){
            if(!this.map || !this.map.removeLayer) return
            this.map.removeLayer(this.timeLayer)
        },

        // ====== 地形图要素添加方法 ======

        // 移除流域底图
        removeBasinLayer:function(){
            if(Object.getOwnPropertyNames(this.basinOverviewLayer).length!==1){
                this.map.removeLayer(this.basinOverviewLayer)
                this.basinOverviewLayer = new Layer({})
            }
        },

        // 添加流域底图
        addBasinLayer:function(){
            const basinSource = new TileWMS({
                url:`${this.baseUrl}/geoserver/agri-agent/wms`,
                params:{
                    LAYERS:'agri-agent:balkhash-overview',
                    VERSION:'1.1.1',
                    TILED:true,
                    STYLES:'RGB_stretch_1to255'
                },
                projection:'EPSG:4326',
                serverType:'geoserver'
            })
            const basinOverviewLayer = new Tile({
                source: basinSource,
                zIndex: 1
            })
            // this.clearMap(0)
            this.basinOverviewLayer = basinOverviewLayer
            this.map.addLayer(this.basinOverviewLayer)
        },


        // 添加山脉图层
        addMountainLayer:function(){
            const mountainSource = new VectorSource({
                url: 'https://overpass-api.de/api/interpreter?data=[out:xml];way[natural=ridge](42.0,72.0,49.0,83.0);(._;>;);out;',
                // format: new GeoJSON()
                format: new OSMXML()
            })
            
            const mountainLayer = new VectorLayer({
                source: mountainSource,
                style: new Style({
                    // 只配置 Stroke(描边)，内部透明无填充
                    stroke: new Stroke({
                        color: '#8B4513', // 棕褐色，代表山脉地形
                        width: 2
                    })
                }),

                zIndex: 10 
            })
            this.mountainLayer = mountainLayer
            this.map.addLayer(this.mountainLayer)
        },

        // 添加河流图层
        addRiverLayer:function(){
            const riverSource = new VectorSource({
                url: 'https://overpass-api.de/api/interpreter?data=[out:xml];way[waterway=river](42.0,72.0,49.0,83.0);(._;>;);out;',
                // format: new GeoJSON()
                format: new OSMXML()
            })
            
            const riverLayer = new VectorLayer({
                source: riverSource,
                style: new Style({
                    stroke: new Stroke({
                        color: '#1E90FF', // 道奇蓝，代表河流
                        width: 2
                    })
                }),
                zIndex: 11
            })
            this.riverLayer = riverLayer
            this.map.addLayer(this.riverLayer)
        },

        // 添加湖泊图层
        addLakeLayer:function(){
            const lakeSource = new VectorSource({
                url: 'https://overpass-api.de/api/interpreter?data=[out:xml];(way[natural=water][water=lake](42.0,72.0,49.0,83.0);relation[natural=water][water=lake](42.0,72.0,49.0,83.0););(._;>;);out;',
                format: new OSMXML()
            })
            
            const lakeLayer = new VectorLayer({
                source: lakeSource,
                style: new Style({
                    stroke: new Stroke({
                        color: '#00FFFF', // 青色，代表湖泊
                        width: 2
                    })
                }),
                zIndex: 12
            })
            this.lakeLayer = lakeLayer
            this.map.addLayer(this.lakeLayer)
        },

        // 添加农田图层
        addFarmlandLayer:function(){
            const farmlandSource = new VectorSource({
                url: 'https://overpass-api.de/api/interpreter?data=[out:xml];(way[landuse=farmland](42.0,72.0,45.0,80.0);relation[landuse=farmland](42.0,72.0,49.0,83.0););out 1000;(._;>;);out;',
                // format: new GeoJSON()
                format: new OSMXML()
            })
            
            const farmlandLayer = new VectorLayer({
                source: farmlandSource,
                style: new Style({
                    stroke: new Stroke({
                        color: '#32CD32', // 石灰绿，代表农田植被
                        width: 1.5
                    })
                }),
                zIndex: 13
            })
            this.farmlandLayer = farmlandLayer
            this.map.addLayer(this.farmlandLayer)
        },


        // ====== 地形图要素移除方法 ======
        // 移除山脉图层
        removeMountainLayer:function(){
            if(Object.getOwnPropertyNames(this.mountainLayer).length!==1){
                this.map.removeLayer(this.mountainLayer)
                this.mountainLayer = new Layer({})
            }
        },

        // 移除河流图层
        removeRiverLayer:function(){
            if(Object.getOwnPropertyNames(this.riverLayer).length!==1){
                this.map.removeLayer(this.riverLayer)
                this.riverLayer = new Layer({})
            }
        },

        // 移除湖泊图层
        removeLakeLayer:function(){
            if(Object.getOwnPropertyNames(this.lakeLayer).length!==1){
                this.map.removeLayer(this.lakeLayer)
                this.lakeLayer = new Layer({})
            }
        },

        // 移除农田图层
        removeFarmlandLayer:function(){
            if(Object.getOwnPropertyNames(this.farmlandLayer).length!==1){
                this.map.removeLayer(this.farmlandLayer)
                this.farmlandLayer = new Layer({})
            }
        },

        //添加地形图图层
        addTopoLayer:function({mountain,river,lake,farmland}){
            // 移除已存在的地形图图层
            this.removeTopoLayers()
            
            // 根据参数调用对应的添加方法
            if(mountain === 1){
                this.addMountainLayer()
            }
            if(river === 1){
                this.addRiverLayer()
            }
            if(lake === 1){
                this.addLakeLayer()
            }
            if(farmland === 1){
                this.addFarmlandLayer()
            }
        },

        //移除地形图图层
        removeTopoLayers:function(){
            this.removeMountainLayer()
            this.removeRiverLayer()
            this.removeLakeLayer()
            this.removeFarmlandLayer()
        },




        addLandMap:function(){
            const landSource = new TileWMS({
                url:`${this.baseUrl}/geoserver/test/wms`,
                params:{
                    LAYERS:'test:feichen',
                    VERSION:'1.1.1',
                    TILED:true
                },
                projection:'EPSG:4326',
                serverType:'geoserver'
            })

            const landLayer = new Tile({
                source:landSource
            })
            this.clearMap(0)
            this.landLayer = landLayer
            this.map.addLayer(this.landLayer)
        },
        // 添加颜色图层
        addColorLayer:function({fillColor,opacity,strokeColor,strokeWidth}) {
            const colorSource = new TileWMS({
                url:`${this.baseUrl}/geoserver/test/wms`,
                params:{
                    LAYERS:'test:feichen_RetGEO',
                    VERSION:'1.1.1',
                    TILED:true,
                    STYLES:'041493',
                    env:`fillColor:${fillColor};opacity:${opacity};strokeColor:${strokeColor};strokeWidth:${strokeWidth}`
                },
                projection:'EPSG:4326',
                serverType:'geoserver'
            })
            const colorLayer = new Tile({
                source:colorSource,
            })
            this.clearMap(1)
            this.colorLayer = colorLayer
            this.map.addLayer(this.colorLayer)
        },
        addHuanTaiLand:function(){
            const huanTaiLandSource = new TileWMS({
                url:`${this.baseUrl}/geoserver/test/wms`,
                params:{
                    LAYERS:'test:huantai_landmass',
                    VERSION:'1.1.1',
                    TILED:true,
                    STYLES:'resetChannel'
                },
                projection:'EPSG:4326',
                serverType:'geoserver'
            })

            const huanTaiLandLayer = new Tile({
                source:huanTaiLandSource
            })
            this.clearMap(0)
            this.huanTaiLandLayer = huanTaiLandLayer
            this.map.addLayer(this.huanTaiLandLayer)
        },
        addHuanTaiColor:function(index){
            let styleSheet= ['huantai_landmass_green_style','huantai_landmass_colorful_style']
            const huanTaiColorSource = new TileWMS({
                url:`${this.baseUrl}/geoserver/test/wms`,
                params:{
                    LAYERS:'test:huantai_shape',
                    VERSION:'1.1.1',
                    TILED:true,
                    STYLES:styleSheet[index]
                },
                projection:'EPSG:4326',
                serverType:'geoserver'
            })

            const huanTaiColorLayer = new Tile({
                source:huanTaiColorSource
            })
            this.clearMap(3)
            this.huanTaiColorLayer = huanTaiColorLayer
            this.map.addLayer(this.huanTaiColorLayer)
        },





        //移除图层的函数
        clearMap:function(i){
            if(Object.getOwnPropertyNames(this.basicLayer).length!==1){
                // this.map.removeLayer(this.basicLayer)
                // this.basicLayer={}
            }
            if(Object.getOwnPropertyNames(this.timeLayer).length!==1){
                this.map.removeLayer(this.timeLayer)
                this.timeLayer={}
            }
            if(Object.getOwnPropertyNames(this.landLayer).length!==1&&i!==1){
                this.map.removeLayer(this.landLayer)
                this.landLayer={}
            }
            if(Object.getOwnPropertyNames(this.colorLayer).length!==1){
                this.map.removeLayer(this.colorLayer)
                this.colorLayer={}
            }
            if(Object.getOwnPropertyNames(this.cropLayer).length!==1){
                this.map.removeLayer(this.cropLayer)
                this.cropLayer={}
            }
            if(Object.getOwnPropertyNames(this.cropLandLayer).length!==1&&i!==2){
                this.map.removeLayer(this.cropLandLayer)
                this.cropLandLayer={}
            }
            if(Object.getOwnPropertyNames(this.huanTaiColorLayer).length!==1){
                this.map.removeLayer(this.huanTaiColorLayer)
                this.huanTaiColorLayer={}
            }
            if(Object.getOwnPropertyNames(this.huanTaiLandLayer).length!==1&&i!==3){
                this.map.removeLayer(this.huanTaiLandLayer)
                this.huanTaiLandLayer={}
            }
            // 移除地形图图层和流域图层
            this.removeTopoLayers()
            this.removeBasinLayer()
        },

        addFeatureLayer:function(list){
            // console.log(list)
            console.log("获得信息",list)
        },


        changeHuanTaiColor:function(index){
            if(index===0){
                this.addHuanTaiColor(0)
            }else if(index===1){
                this.addHuanTaiColor(1)
            }
        },

        // 初始化地图
        initMap:function(){
            this.map = new Map({
                target: 'mapView',
            })
        },
        compare:function(map){
            console.log(map===this.map)
        },
    },

    getters:{

    }
})
export default useMapStore
