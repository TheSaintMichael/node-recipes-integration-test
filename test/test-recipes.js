const chai = require('chai');
const chaiHttp = require('chai-http');

const {app, runServer, closeServer} = require('../server');

// this lets us use *should* style syntax in our tests
// so we can do things like `(1 + 1).should.equal(2);`
// http://chaijs.com/api/bdd/
const should = chai.should();

// This let's us make HTTP requests
// in our tests.
// see: https://github.com/chaijs/chai-http
chai.use(chaiHttp);


describe('Recipes', function() {
 
  // Before our tests run, we activate the server. Our `runServer`
  // If we didn't return a promise here,
  // there's a possibility of a race condition where our tests start
  // running before our server has started.

  before(function() {
    return runServer();
  });

  // although we only have one test module at the moment, we'll
  // close our server at the end of these tests. 

  after(function() {
    return closeServer();
  });

  // test strategy:
  //   1. make request to `/Recipes`
  //   2. inspect response object and prove has right code and have
  //   right keys in response object.
  it('should list items on GET', function() {
    return chai.request(app)
      .get('/recipes')
      .then(function(res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');

        // because we create three items on app load
        res.body.length.should.be.at.least(1);
        
        // each item should be an object with key/value pairs
        // for `id`, `name` and `checked`.
        const expectedKeys = ['name', 'id', 'ingredients'];

        res.body.forEach(function(item) {
          item.should.be.a('object');
          item.should.include.keys(expectedKeys);
        });
      });
  });

  // test strategy:
  //  2. inspect response object and prove it has right
  //  status code and that the returned object has an `id`
  it('should add an item on POST', function() {
    const recipeTest = name: 'Sandwich', ingredients: ['White Bread', 'Tomato', 'pinch of salt', 'Protein']};
    return chai.request(app)
      .post('/recipes')
      .send(recipeTest)
      .then(function(res) {
        res.should.have.status(201);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body.should.include.keys('name', 'id', 'ingredients');
        res.body.id.should.not.be.null;
        // response should be deep equal to `recipeTest` from above if we assign
        // `id` to it from `res.body.id`
        res.body.should.deep.equal(Object.assign(recipeTest, {id: res.body.id}));
      });
  });

  it('should update items on PUT', function() {
    // we initialize our updateData here and then after the initial
    // request to the app, we update it with an `id` property so
    // we can make a second, PUT call to the app.
    const updateData = {
      name: 'foo',
      ingredients: ['bar'];
    };

    return chai.request(app)

   // first, we have to GET so we have an idea of object to update.
      .get('/recipes')
      .then(function(res) {
        updateData.id = res.body[0].id;

        return chai.request(app)
          .put(`/recipes/${updateData.id}`)
          .send(updateData);
      })

      // prove that the PUT request has right status code
      // and returns updated item
      .then(function(res) {

        res.should.have.status(200); //Return status 200
        res.should.be.json; //Return JSON string
        res.body.should.be.a('object'); //Return Object
        res.body.should.deep.equal(updateData); //Dummy Data 'UpdateData'

        // Does the body contain an id, name, ingredient?
        res.body.should.include.keys('id', 'name', 'ingredients');

        //Does the body have an id?
        res.body.id.should.equal(updateData.id);

      });
  });

  // test strategy:
  //  1. GET a shopping list items so we can get ID of one
  //  to delete.
  //  2. DELETE an item and ensure we get back a status 204
  it('should delete items on DELETE', function() {
    return chai.request(app)
      // first have to get so we have an `id` of item
      // to delete
      .get('/recipes')
      .then(function(res) {
        return chai.request(app)
          .delete(`/recipes/${res.body[0].id}`);
      })
      .then(function(res) {
        res.should.have.status(204);
      });
  });
});