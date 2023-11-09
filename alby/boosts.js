const boost = async (req, res) => {
  const body = req.body;
  console.log("body: ", body);

  res.status(200).json(body);
};

export default boost;
