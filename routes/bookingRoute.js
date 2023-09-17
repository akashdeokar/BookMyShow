const authMiddleware = require("../middlewares/authMiddleware");

const router = require("express").Router();
const stripe = require("stripe")(process.env.stripe_key);
const Booking = require('../models/bookingModel')
const Show = require('../models/showModel')

router.post('/make-payment',authMiddleware,async(req,res)=>{
    try{
        const {token,amount} = req.body;
        console.log(token);
        const customer = await stripe.customers.create({
            email:token.email,
            source:token.id
        })
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: 'usd',
          customer: customer.id,
          payment_method_types: ['card'],
          receipt_email: token.email,
          description: "Token has been assigned to the movie!"
        });

      const transactionId = paymentIntent.id;
        res.send({
            success:true,
            message:"Payment done, Ticket booked",
            data:transactionId
        })

    }catch(err){    
        res.send({
            success:false,
            message:err.message
        })
    }
})

//book shows
router.post("/book-show", authMiddleware, async (req, res) => {
    try {
      // save booking
      const newBooking = new Booking(req.body);
      await newBooking.save();

      const show = await Show.findById(req.body.show);
      // update seats
      await Show.findByIdAndUpdate(req.body.show, {
        bookedSeats: [...show.bookedSeats, ...req.body.seats],
      });

      res.send({
        success: true,
        message: "Show booked successfully",
        data: newBooking,
      });
    } catch (error) {
      res.send({
        success: false,
        message: error.message,
      });
    }
  });


  router.get("/get-bookings", authMiddleware, async (req, res) => {
    try {
      const bookings = await Booking.find({ user: req.body.userId })
        .populate("user")
        .populate("show")
            .populate({
                path: "show",
                populate: {
                path: "movie",
                model: "movies",
                },
            })
            .populate({
                path: "show",
                populate: {
                path: "theatre",
                model: "theatres",
                },
            });

      res.send({
        success: true,
        message: "Bookings fetched successfully",
        data: bookings,
      });
    } catch (error) {
      res.send({
        success: false,
        message: error.message,
      });
    }
  });


module.exports = router;