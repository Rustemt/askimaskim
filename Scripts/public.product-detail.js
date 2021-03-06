;(function ( $, window, document, undefined ) {
    
    var pluginName = 'productDetail';
    var galPluginName = "plugin_smartGallery";
    
    function ProductDetail( element, options ) {
    	
		var self = this;

		this.element = element;
		var el = this.el = $(element);

		var meta = $.metadata ? $.metadata.get(element) : {};
		var opts = this.options = $.extend(true, {}, options, meta || {});
		
		this.init = function() {
			
		    var opts = this.options;
			
		    this.createGallery(opts.galleryStartIndex);
			
            //TODO: nur wenn varianten da sind
		    $('#pd-gallery-container-outer').throbber({ white: false, small: false, show: false });

		    $('#pd-manufacturer img').css({ 'max-width': opts.galleryWidth });

			// update product data and gallery
		    $(el).find(':input').change(function () {
		    	var context = $(this).closest('.product-variant-line'),
		    		url = opts.updateUrl;

		    	if (context[0])		// multiple variant template
		    		url += '&productVariantId=' + context.attr('data-productvariantid');
				else
		    		context = el;

                /*
		    	if ($(this).attr('name').endsWith('EnteredQuantity'))
		    		url += '&updateGallery=false';
                */  


		    	$({}).doAjax({
		    		//smallIcon: '.price-details', // TODO... selector or object where to show small spinner
		    		url: url,
		    		data: context.find(':input').serialize(),
		    		callbackSuccess: function (resp) {
		    			self.updateDetailData(resp, context);
		    		}
		    	});
		    });
			
			return this;
		};

		this.updateDetailData = function (data, context) {
		    var gallery = $('#pd-gallery').data(galPluginName);

		    if (data.GalleryHtml) {
		        var cnt = $('#pd-gallery-container');
		        cnt.stop(true, true).transition({ opacity: 0 }, 300, "ease-out", function () {
		            gallery.reset();
		            cnt.html(data.GalleryHtml);
		            self.createGallery(data.GalleryStartIndex);

		            _.delay(function () {
		                cnt.stop(true, true).transition({ opacity: 1 }, 175, "ease-in");
		            }, 200);
		            
		        });
		    }
		    else if (data.GalleryStartIndex >= 0) {
		        if (data.GalleryStartIndex != gallery.currentIndex) {
		            gallery.showImage(data.GalleryStartIndex);
		        }
		    }

		    //update detail data in view

		    //prices
		    var priceBlock = $(".price-details", $(context));
		    priceBlock.find(".base-price").html(data.Price.Base.Info);
		    priceBlock.find(".old-product-price").html(data.Price.Old.Text);
		    priceBlock.find('.product-price-without-discount').html(data.Price.WithoutDiscount.Text);
		    priceBlock.find('.product-price-with-discount').html(data.Price.WithDiscount.Text);

		    //delivery time
		    var deliveryTime = priceBlock.find(".delivery-time");
		    deliveryTime.find(".delivery-time-color").css("background-color", data.Delivery.Color).attr("title", data.Delivery.Name);
		    deliveryTime.find(".delivery-time-value").html(data.Delivery.Name);
		     
		    //attributes
		    var attributesBlock = $(".attributes", $(context));
		    
		    function updateAttrLine(className, newValue) {
		        attrLine = attributesBlock.find(className);
		        if (newValue) {
		            attrLine.find(".value").html(newValue);
		            attrLine.removeClass("hide");
		            attrLine.addClass("in");
		        } else {
		            attrLine.find(".value").html();
		            attrLine.addClass("hide");
		            attrLine.removeClass("in");
		        }
		    }

		    updateAttrLine(".attr-sku", data.Number.Sku.Value);
		    updateAttrLine(".attr-gtin", data.Number.Gtin.Value);
		    updateAttrLine(".attr-mpn", data.Number.Mpn.Value);
		    updateAttrLine(".attr-weight", data.Measure.Weight.Text);
		    updateAttrLine(".attr-length", data.Measure.Length.Text);
		    updateAttrLine(".attr-width", data.Measure.Width.Text);
		    updateAttrLine(".attr-height", data.Measure.Height.Text);
		    updateAttrLine(".attr-stock", data.Stock.Availability.Text);

		    context.find('.add-to-cart .form-inline').toggle(!data.Stock.Availability.Unavailable);
		};
		
		this.initialized = false;
		this.init();
		this.initialized = true;
	}
	
	ProductDetail.prototype = {
		gallery: null,
		activePictureIndex: 0,
		
		createGallery: function (startIndex) {
			var self  = this;
			var opts = this.options;

			gallery = $('#pd-gallery').smartGallery({
			    width: opts.galleryWidth,	
			    height: opts.galleryHeight,
				enableDescription: opts.showImageDescription,
				thumbSize: opts.galleryThumbSize || 50,
				startIndex: startIndex || 0,
				zoom: {
				    enabled: opts.enableZoom,
                    zoomType: opts.zoomType
				},
				box: {
					enabled: true	
				}
			});
		}
		
    }

    // the global, default plugin options
	_.provide('$.' + pluginName);
	$[pluginName].defaults = {
	    // Width of the gallery, set to false and it will read the CSS width
	    galleryWidth: null,
	    // Height of the gallery, set to false and it will read the CSS height
	    galleryHeight: null,
        // The max size of the gallery zhumbs
	    galleryThumbSize: 50,
        // The 0-based image index to start the gallery with
	    galleryStartIndex: 0,
        // whether to show the image description
	    showImageDescription: false,
        // whether to enable image zoom
	    enableZoom: true,
        // type of zoom (window | inner | lens)
	    zoomType: "window",
        // url to the ajax method, which loads variant combination data
        updateUrl: null,
	}
	
	$.fn[pluginName] = function( options ) {
		
		return this.each(function() {
		    if (!$.data(this, 'plugin_' + pluginName)) {
		        options = $.extend( true, {}, $[pluginName].defaults, options );
		        $.data(this, 'plugin_' + pluginName, new ProductDetail( this, options ));
		    }
		});
	}
    
})(jQuery, window, document);