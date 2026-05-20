import {defineStore, storeToRefs} from "pinia";
import axios from "axios";
import {Layer, Tile} from "ol/layer";
import {OSM, TileWMS, WMTS, XYZ} from "ol/source";
import {Map, View} from "ol";
import {unByKey} from "ol/Observable";
// 新增

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';

import { Style, Stroke, Fill, Text } from 'ol/style';

import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';

import OSMXML from 'ol/format/OSMXML';
import EsriJSON from 'ol/format/EsriJSON';

import { transformExtent } from 'ol/proj';

import { apply } from 'ol-mapbox-style';
import { markRaw } from 'vue';
import VectorTileLayer from 'ol/layer/VectorTile';

import TileLayer from 'ol/layer/Tile';



// 巴尔喀什湖流域的经纬度边界框
const BALKHASH_EXTENT = [72.828369, 43.325178, 81.738281, 47.620975];



const useMapStore =  defineStore('map',{
    state:()=>({
            currentYear:2023,
            currentMonth:1,
            map: null,
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
            is3D:false,
            cropClassificationLayers:[],
            
            basinBoundaryUrl:'', // 用于将流域边界shp的url传递给3D视图
            basinBasicLayer:new Layer({}), // 流域底图layer
            basinBoundaryLayer:new Layer({}), // 流域边界layer
            basinMaskLayer:new Layer({}), // 流域遮罩layer
            basinLabelLayer:new Layer({}), // 流域标签layer
            agriParcelLayer:new Layer({}), // 农田地块layer

            timeLayer: new Layer({}),
            landLayer:new Layer({}),
            colorLayer:new Layer({}),
            cropLayer:new Layer({}), // 农作物layer
            basicLayer:new Layer({}),
            cropLandLayer:new Layer({}),
            cropLayerLine:new Layer({}),
            huanTaiLandLayer:new Layer({}),
            huanTaiColorLayer:new Layer({}),
            administrativeLayer:new Layer({}),
            cropImageryLayers:[{},{}],
            clickItem:-1, // 当前选中的要素ID
            featureId:0,
            currentCrop:'',
            cropList:['other','wheat','corn','vegetable'], // 作物类型

            // currentTopo: '', // 当前选中的地形图要素
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
        getAndLoadCropInfo:async function(){
            try {
                let res = await this.loadingInfo('crop')
                this.cropInfo = res.data
                console.log("作物信息：", this.cropInfo);
                
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
            let cropOpacityInfo ={other:0,wheat:0,corn:0,vegetable:0}
            crop.forEach((item)=>{
                console.log(item);
                if(item.index===0){
                    cropOpacityInfo.other=1
                }
                else if(item.index===1){
                    cropOpacityInfo.wheat=1
                }
                else if(item.index===2){
                    cropOpacityInfo.corn=1
                }
                else if(item.index===3){
                    cropOpacityInfo.vegetable=1
                }
            })
            // console.log(cropOpacityInfo);
            
            // alert([cropOpacityInfo.other,cropOpacityInfo.cotton,cropOpacityInfo.corn,cropOpacityInfo.wheat])
            this.addCropLayer(cropOpacityInfo)
        },




        // 添加基础图层
        // params: {type: ArcGIS的图层类型}
        // type: World_Topo_Map | World_Imagery | World_Street_Map | World_Terrain_Base | World_Shaded_Relief | 
        //       World_Physical_Map | NatGeo_World_Map | World_Ocean_Base | World_Boundaries_and_Places ...
        addBasicLayer:function(type='World_Imagery'){
            const URL = `https://server.arcgisonline.com/ArcGIS/rest/services/${type}/MapServer/tile/{z}/{y}/{x}`
            const layer = new Tile({
                source:new XYZ({
                    url: URL,
                    crossOrigin: "anonymous"
                })
            });


            this.clearMap(0);
            this.basicLayer = layer;
            if(this.map && this.map.addLayer) this.map.addLayer(this.basicLayer);
        },

        // 添加时间序列图层
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


        // 作物的影像底图
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

        // 作物边界
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

        // 添加农作物图层
        // {param: {所有作物类型}}
        addCropLayer:function({other, wheat, corn, vegetable}){
            // console.log("作物选择", wheat, corn, vegetable, other);
            
            if(!this.map || !this.map.addLayer) return
            

            // this.map.removeLayer(this.cropLandLayer)
            const source = new TileWMS({
                url:`${this.baseUrl}/geoserver/agri-agent/wms`,
                params: {
                    LAYERS:'agri-agent:bh-cropclass1',
                    VERSION: '1.1.1',
                    TILED: true,
                    STYLES:'agri-agent:crop-style',
                    env:`other:${other};wheat:${wheat};corn:${corn};vegetable:${vegetable}`, // 利用env参数选择展示单个作物
                                                                                             // 默认展示所有作物
                                                                                             // 例：env:other:0;wheat:1;corn:0;vegetable:0，则展示小麦
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

        // 行政区矢量边界
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


        

        // 添加农田地块（多个shp）
        // addAgriParcelLayer:function(){
        //     if(!this.map || !this.map.addLayer) return

        //     // 10 个图层名称（workspace:layer）
        //     const layers = [
        //         'agri-agent:agri-parcel-liyv-1',
        //         'agri-agent:agri-parcel-liyv-2',
        //         'agri-agent:agri-parcel-liyv-3',
        //         'agri-agent:agri-parcel-liyv-4',
        //         'agri-agent:agri-parcel-bu8',
        //         'agri-agent:agri-parcel-bu9',
        //         'agri-agent:agri-parcel-bu11',
        //         'agri-agent:agri-parcel-bu12',
        //         'agri-agent:agri-parcel-bu13',
        //         'agri-agent:agri-parcel-bu101'
        //     ]

        //     const layersParam = layers.join(',')
        //     const wmsUrl = `${this.baseUrl}/geoserver/agri-agent/wms`
        //     const params = {
        //         LAYERS: layersParam,
        //         VERSION: '1.1.1',
        //         TILED: true,
        //     }

        //     // 获取数据源
        //     const parcelSource = new TileWMS({
        //         url: wmsUrl,
        //         params: params,
        //         projection: 'EPSG:4326',
        //         serverType: 'geoserver'
        //     })
        //     // 创建layer
        //     const parcelLayer = new Tile({
        //         source: parcelSource,
        //         zIndex: 50
        //     })

        //     // 移除之前可能存在的同类图层
        //     this.removeAgriParcelLayer()
        //     this.agriParcelLayer = parcelLayer
        //     this.map.addLayer(this.agriParcelLayer)
        // },


        // 添加农田地块
        addAgriParcelLayer: function() {
            if (!this.map || !this.map.addLayer) return       


            const parcelSource = new TileWMS({
                url: `${this.baseUrl}/geoserver/agri-agent/wms`,
                params:{
                    LAYERS: 'agri-agent:bh-agri-parcel',
                    VERSION: '1.1.1',
                    TILED: true,
                    STYLES: 'red-polygon'
                },
                projection: 'EPSG:4326',
                serverType: 'geoserver'
            })
            
            const parcelLayer = new Tile({
                source: parcelSource,
                zIndex: 50
            })


            this.removeAgriParcelLayer()
            this.agriParcelLayer = parcelLayer
            this.map.addLayer(this.agriParcelLayer)
        },


        // 移除农田地块
        removeAgriParcelLayer:function(){
            if(!this.map || !this.map.removeLayer) return
            try{
                if(this.agriParcelLayer && Object.getOwnPropertyNames(this.agriParcelLayer).length!==0){
                    this.map.removeLayer(this.agriParcelLayer)
                    this.agriParcelLayer = new Layer({})
                }
            }catch(e){console.warn(e)}
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


    

        // 流域底图（ArcGIS底图）
        // param：{type:arcgis底图类型}
        addBasinBasicLayer:function(type='NatGeo_World_Map'){
            const URL = `https://server.arcgisonline.com/ArcGIS/rest/services/${type}/MapServer/tile/{z}/{y}/{x}`
            const basinBasicLayer = new Tile({
                source:new XYZ({
                    url: URL,
                    crossOrigin: "anonymous"
                })
            })

            this.basinBasicLayer = basinBasicLayer
            this.map.addLayer(this.basinBasicLayer)
        },


        // 移除流域底图
        removeBasinLayer:function(){
            if(this.map && this.map.removeLayer && Object.getOwnPropertyNames(this.basinBasicLayer).length!==1){
                this.map.removeLayer(this.basinBasicLayer)
                this.basinBasicLayer = new Layer({})
            }
            // 移除流域所有图层
            try{
                if(this.basinBoundaryLayer && this.map && this.map.removeLayer){
                    this.map.removeLayer(this.basinBoundaryLayer)
                    this.basinBoundaryLayer = new Layer({})
                }
            }catch(e){}
            try{
                if(this.basinMaskLayer && this.map && this.map.removeLayer){
                    this.map.removeLayer(this.basinMaskLayer)
                    this.basinMaskLayer = new Layer({})
                }
            }catch(e){}
            try{
                if(this.basinLabelLayer && this.map && this.map.removeLayer){
                    this.map.removeLayer(this.basinLabelLayer)
                    this.basinLabelLayer = new Layer({})
                }
            }catch(e){}
        },

        // 添加流域边界图层
        addBasinBoundaryLayer:function(){
            console.log("add BasinLayer!!")
            this.basinBoundaryUrl = `${this.baseUrl}/geoserver/agri-agent/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=agri-agent:bh-basin-shp&outputFormat=application/json`

            const basinSource = new VectorSource({
                url: this.basinBoundaryUrl,
                format: new GeoJSON(),
            });

            // boundary stroke (will be placed above the mask)
            const basinBoundaryLayer = new VectorLayer({
                source: basinSource,
                zIndex: 4,
                style: new Style({
                    stroke: new Stroke({
                        color: 'rgba(255,0,0,0.5)',
                        width: 3
                    }),
                })
            });

            // 流域内部高亮遮罩
            const maskSource = new VectorSource();
            const maskLayer = new VectorLayer({
                source: maskSource,
                zIndex: 3,
                style: new Style({
                    fill: new Fill({ color: 'rgba(0,0,0,0.6)' }),
                    stroke: null
                })
            });

            // 添加遮罩
            const buildMask = () => {
                const features = basinSource.getFeatures();
                if(!features || features.length === 0) return;

                // world ring in lon/lat then transformed to map projection
                const viewProj = this.map.getView().getProjection();
                const worldRingLonLat = [
                    [-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]
                ];
                const worldRing = worldRingLonLat.map(c => fromLonLat(c, viewProj));

                const holes = [];
                features.forEach(f => {
                    const geom = f.getGeometry();
                    if(!geom) return;
                    const type = geom.getType();
                    if(type === 'Polygon'){
                        const rings = geom.getCoordinates();
                        rings.forEach(r => holes.push(r));
                    } else if(type === 'MultiPolygon'){
                        const polys = geom.getCoordinates();
                        polys.forEach(poly => {
                            poly.forEach(r => holes.push(r));
                        })
                    }
                });

                const maskCoords = [worldRing].concat(holes);
                const maskFeature = new Feature(new Polygon(maskCoords));
                maskSource.clear();
                maskSource.addFeature(maskFeature);
            };

            basinSource.on('change', () => {
                // wait until features are loaded into the source
                if(basinSource.getState && basinSource.getState() === 'ready'){
                    buildMask();
                } else if(basinSource.getFeatures().length>0){
                    buildMask();
                }
            });

            this.basinBoundaryLayer = basinBoundaryLayer;
            this.basinMaskLayer = maskLayer;
            this.map.addLayer(this.basinMaskLayer);
            this.map.addLayer(this.basinBoundaryLayer);
        },


        // 添加流域标签（自定义geojson）
        // 添加流域标签（自定义geojson）
addBasinLabelLayer: function() {
    const labelSource = new VectorSource({
        url: '/data/balkhash-labels.geojson', 
        format: new GeoJSON(),
    });

    const labelLayer = new VectorLayer({
        source: labelSource,
        // 修改点 1：将 style 函数改为箭头函数 (以保留 this 指向)，并接收 resolution 参数
        style: (feature, resolution) => {
            const name = feature.get('name:zh') || feature.get('name');

            if (!name) return null;

            // 修改点 2：通过 resolution 获取当前的缩放级别 (zoom)
            // 注意：确保 this.map 已经被正确初始化并且可以访问
            let zoom = this.map.getView().getZoomForResolution(resolution);
            
            // 修改点 3：根据缩放级别计算动态字体大小 (单位：px)
            // 基础算法示例：zoom 变大（地图放大）时，字体也适度变大
            // 你可以根据实际的初始视角（如 zoom=5）和视觉需求调整这里的基数和乘数
            let fontSize = 12 + (zoom - 5) * 1.5; 

            // 修改点 4：限制字体大小的上下限，避免缩放过度导致字体看不清或占满全屏
            // 这里限制最小 12px，最大 26px
            fontSize = Math.max(10, Math.min(fontSize, 26)); 

            // 可选：当地图缩放到很小（视角很高）时，直接隐藏标签以防止密密麻麻
            // if (zoom < 4) return null;

            return new Style({
                text: new Text({
                    text: name,
                    // 修改点 5：使用模板字符串将动态计算的字体大小应用到 font 属性中
                    font: `bold ${fontSize}px "FangSong", serif`,
                    fill: new Fill({
                        color: '#000000'
                    }),
                    stroke: new Stroke({
                        color: '#FFFFFF',
                        width: 1.5
                    }),
                    offsetY: -15 // 向上偏移 15 像素
                })
            });
        },
        zIndex: 99
    });
    
    this.basinLabelLayer = labelLayer;
    this.map.addLayer(this.basinLabelLayer);
    
    return labelLayer;
},

        // 添加流域标签（天地图）
        addBasinLabelLayer1: function() {
            const tk = "37680d3f8085db6effbc0c031cca6106"; 
            const URL = `http://t{0-7}.tianditu.gov.cn/cta_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cta&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`;

            const labelLayer = new Tile({
                source: new XYZ({
                    url: URL,
                    crossOrigin: 'anonymous' // 解决跨域导致 Canvas 污染的问题
                }),
                zIndex: 99, // 设置一个较高的 zIndex，确保注记文字盖在底层地图之上
                extent: BALKHASH_EXTENT
            });

            this.basinLabelLayer = labelLayer;
            this.map.addLayer(this.basinLabelLayer);
        },

        // 添加流域标签 arcgis
        addBasinLabelLayer2: function() {
            const labelUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}`;

            const labelLayer = new Tile({
                source: new XYZ({
                    url: labelUrl,
                    crossOrigin: 'anonymous'
                }),
                zIndex: 99, // 确保注记在最上层
                name: 'BasinLabel',
                extent: BALKHASH_EXTENT
            });

            this.basinLabelLayer = labelLayer;
            this.map.addLayer(this.basinLabelLayer);
        },

        // 添加流域标签 OSM
        addBasinLabelLayer3: function() {
            // 使用 osm-cn 中文瓦片服务（由 OSM 中国社区维护）
            // 注意：此服务中文覆盖集中在中国境内，海外区域可能退化为英文
            const labelUrl = `https://tile.openstreetmap.org/{z}/{x}/{y}.png`;

            // 更推荐使用支持中文的 CartoDb Voyager（中文地名优先渲染）
            const cartoLabelUrl = `https://{a-c}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png`;

            const labelLayer = new Tile({
                source: new XYZ({
                    url: cartoLabelUrl,
                    crossOrigin: 'anonymous',
                    // 通过 Accept-Language 头提示服务器优先返回中文（部分服务支持）
                    tileLoadFunction: function(tile, src) {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', src);
                        xhr.setRequestHeader('Accept-Language', 'zh-CN,zh;q=0.9');
                        xhr.responseType = 'blob';
                        xhr.onload = function() {
                            const objectUrl = URL.createObjectURL(xhr.response);
                            tile.getImage().src = objectUrl;
                        };
                        xhr.send();
                    }
                }),
                zIndex: 99,
                name: 'BasinLabel'
            });

            this.basinLabelLayer = labelLayer;
            this.map.addLayer(this.basinLabelLayer);
        },

        // 添加流域标签 Google
        addBasinLabelLayer4: function() {
            // 谷歌纯标签与路网透明层，强制中文
            const googleLabelUrl = 'https://mt0.google.com/vt/lyrs=h&hl=zh-CN&gl=CN&x={x}&y={y}&z={z}';

            const labelLayer = new TileLayer({
                source: new XYZ({
                    url: googleLabelUrl,
                    crossOrigin: 'anonymous'
                }),
                zIndex: 99, 
                // 关键折中策略：设置半透明。
                // 这会让不需要的城市和公路“融入”底图，不喧宾夺主，同时保留基本的中文地理参考。
                opacity: 0.6, 
                name: 'BasinLabel_Chinese_Google'
            });

            this.basinLabelLayer = labelLayer;
            this.map.addLayer(this.basinLabelLayer);
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
            // 如果 map 未初始化，直接返回，避免对不可用的数据源或未挂载的 map 进行操作
            if(!this.map || !this.map.removeLayer) return

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
            
            // 移除流域底图、边界等
            this.removeBasinLayer();
            // 移除农田图层
            this.removeAgriParcelLayer();
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
            console.log("init map!!")
            const map = new Map({
                target: 'mapView',
                view: new View({
                    center: [(72 + 82) / 2, (42 + 50) / 2],
                    zoom: 6.5,
                    projection: "EPSG:4326",
                }),
            })
            this.map = markRaw(map)
            
        },
        compare:function(map){
            console.log(map===this.map)
        },
    },

    getters:{

    }
})
export default useMapStore
